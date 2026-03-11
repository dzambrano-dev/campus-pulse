/**
 * login.js
 * API call for logins
 */

import { json, jsonError, hashPassword } from "./utils.js"

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
			if (!resolved) return jsonError("Invalid username/email or password", 401);
			lookupUsername = resolved;
		}

		// Retrieve user from KV
		const storedUser = await env.USERS.get(lookupUsername);
		if (!storedUser) return jsonError("Invalid username or password", 401);

		const user = JSON.parse(storedUser);

		// Hash password and verify it matches stored hash
		const passwordHash = await hashPassword(password);
		if (passwordHash !== user.passwordHash) return jsonError("Invalid username or password", 401);

		// Generate a session token
		const token = crypto.randomUUID();
		const week = 60 * 60 * 24 * 7

		// Store the token and return it to the client
		await env.SESSIONS.put(token, lookupUsername, { expirationTtl: week });
		return json({ success: true, token });
	} catch (err) {
		// Handle unexpected errors
		return jsonError("Invalid request", 400);
	}
}
