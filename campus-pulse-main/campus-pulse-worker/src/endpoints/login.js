/**
 * login.js
 * API call for logins — with brute-force rate limiting.
 */
import { jsonError, verifyPassword, withSessionCookie } from "../utils.js";
import {
	checkRateLimit,
	recordFailedAttempt,
	clearRateLimit,
	rateLimitResponse,
} from "../security/rateLimit.js";

export async function login(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	// Get client IP from Cloudflare header
	const ip = request.headers.get("CF-Connecting-IP") ?? "127.0.0.1";

	// Check rate limit BEFORE touching credentials
	const limitCheck = await checkRateLimit(env.RATE_LIMITS, ip);
	if (limitCheck.limited) return rateLimitResponse(limitCheck.retryAfter);

	try {
		// Parse request
		let { username, password } = await request.json();

		// Normalize inputs
		username = username?.trim().toLowerCase();
		password = password?.trim();

		// Prevent empty logins
		if (!username || !password) return jsonError("Missing username or password");

		let lookupUsername = username;

		// If user entered an email, resolve it using EMAILS KV
		if (username.includes("@")) {
			const resolved = await env.EMAILS.get(username);
			if (!resolved) {
				// Count as a failed attempt
				const { limited, retryAfter } = await recordFailedAttempt(env.RATE_LIMITS, ip);
				if (limited) return rateLimitResponse(retryAfter);
				return jsonError("Invalid username/email or password", 401);
			}
			lookupUsername = resolved;
		}

		// Retrieve user from KV
		const storedUser = await env.USERS.get(lookupUsername);
		if (!storedUser) {
			const { limited, retryAfter } = await recordFailedAttempt(env.RATE_LIMITS, ip);
			if (limited) return rateLimitResponse(retryAfter);
			return jsonError("Invalid username or password", 401);
		}

		const user = JSON.parse(storedUser);

		// Hash password and verify it matches stored hash
		const match = await verifyPassword(password, user.passwordHash);
		if (!match) {
			const { limited, retryAfter, remaining } = await recordFailedAttempt(env.RATE_LIMITS, ip);
			if (limited) return rateLimitResponse(retryAfter);
			return jsonError(
				`Invalid username or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
				401
			);
		}

		// Successful login — clear any recorded failures for this IP
		await clearRateLimit(env.RATE_LIMITS, ip);

		// Generate and store a session token through cookies
		const token = crypto.randomUUID();
		const maxAge = 60 * 60 * 24 * 7;
		await env.SESSIONS.put(token, lookupUsername, { expirationTtl: maxAge });
		return withSessionCookie({ success: true }, token, maxAge);

	} catch (err) {
		// Handle unexpected errors
		return jsonError("Invalid request", 400);
	}
}
