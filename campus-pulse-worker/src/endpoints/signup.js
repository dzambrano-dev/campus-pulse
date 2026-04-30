/**
 * signup.js
 * API call for creating accounts
 */

import { jsonError, withSessionCookie } from "../utils.js"

export async function signup(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		const { avatar, username } = await request.json();

		const normalizedUsername = username?.trim().toLowerCase();
		const validationError = validateSignup(avatar, normalizedUsername);
		if (validationError) return jsonError(validationError);

		// Check username availability
		const existingUser = await env.USERS.get(normalizedUsername)
		if (existingUser) return jsonError("This username already exists");

		// Get session
		const cookie = request.headers.get("Cookie") || "";
		const token = cookie.match(/session=([^;]+)/)?.[1];
		if (!token) return jsonError("Invalid session", 401);

		const sessionData = await env.SESSIONS.get(token);
		if (!sessionData) return jsonError("Session expired", 401);

		let parsed;
		try {
			parsed = JSON.parse(sessionData);
		} catch {
			return jsonError("Invalid session", 401);
		}

		if (!parsed.onboarding) return jsonError("Invalid flow", 400);

		const { email, name } = parsed;
		const normalizedEmail = email.trim().toLowerCase();

		// Create user record
		const user = {
			email: normalizedEmail,
			name: name,
			username: normalizedUsername,
			avatar: avatar,
			role: "user",
			interests: [],
			oauth: true
		};

		// Save username and email in KVs
		await env.USERS.put(normalizedUsername, JSON.stringify(user));
		await env.EMAILS.put(normalizedEmail, normalizedUsername);

		// Upgrade session to permanent
		await env.SESSIONS.delete(token);
		const newToken = crypto.randomUUID();
		const maxAge = 60 * 60 * 24 * 7;
		await env.SESSIONS.put(newToken, normalizedUsername, { expirationTtl: maxAge });
		return withSessionCookie({ success: true }, newToken, maxAge);
	} catch (error) {
		// Handle unexpected errors
		return jsonError("Invalid request");
	}
}

// Validate signup and return an error if invalid
function validateSignup(avatar, username) {
    if (!avatar || !username) return "Missing a required field";
    if (!validateUsername(username)) return "Username must be 5-20 characters and contain only letters or numbers";
    return null;
}

// Username must be alphanumeric and between 5 and 20 characters
function validateUsername(username) {
    return /^[a-zA-Z0-9]{5,20}$/.test(username);
}
