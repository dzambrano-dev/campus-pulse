/**
 * login.js
 * API call for logins — with brute-force rate limiting.
 */

import { jsonError, verifyPassword, withSessionCookie } from "../utils.js";
import { checkAccountLock, recordLoginFailure, clearLoginFailures } from "../security/accountLockout.js";

export async function login(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

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
				return jsonError("Invalid username/email or password", 401);
			}
			lookupUsername = resolved;
		}

		// Check account lock state
		const lock = await checkAccountLock(env.SECURITY, lookupUsername);
		if (lock.locked) {
			return jsonError(`Too many failed attempts. Try again in ${Math.ceil(lock.retryAfter)} seconds.`, 429);
		}

		// Retrieve user from KV
		const storedUser = await env.USERS.get(lookupUsername);
		if (!storedUser) {
			return jsonError("Invalid username or password", 401);
		}

		const user = JSON.parse(storedUser);

		// Hash password and verify it matches stored hash
		const match = await verifyPassword(password, user.passwordHash);
		if (!match) {
			const result = await recordLoginFailure(env.SECURITY, lookupUsername);
			if (result.locked) {
				return jsonError(`Too many failed attempts. Try again in ${Math.ceil(result.retryAfter)} seconds.`, 429);
			}

			return jsonError(`Invalid username or password. ${result.remaining} attempt${result.remaining === 1 ? "" : "s"} remaining.`, 401);
		}

		// Clear failures on success
		await clearLoginFailures(env.SECURITY, lookupUsername);

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
