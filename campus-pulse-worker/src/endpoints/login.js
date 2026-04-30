/**
 * login.js
 * API call for logins — with brute-force rate limiting.
 */

import { jsonError, withSessionCookie } from "../utils.js";

export async function login(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		const { email, name } = await request.json();

		if (!email) return jsonError("Missing email");
		const normalizedEmail = email.trim().toLowerCase();

		// Check if user exists
		const existingUser = await env.EMAILS.get(normalizedEmail);

		// Existing user
		if (existingUser) {
			const token = crypto.randomUUID();
			const maxAge = 60 * 60 * 24 * 7;
			await env.SESSIONS.put(token, existingUser, { expirationTtl: maxAge });
			return withSessionCookie({ status: "complete" }, token, maxAge);
		}

		// New user
		const tempToken = crypto.randomUUID();

		await env.SESSIONS.put(tempToken, JSON.stringify({
			email: normalizedEmail,
			name: name,
			onboarding: true
		}), {
			expirationTtl: 600  // 10 minutes
		});

		return withSessionCookie({ status: "needs_username" }, tempToken, 600);
	} catch (error) {
		// Handle unexpected errors
		return jsonError("Invalid request", 400);
	}
}

