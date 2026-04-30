/**
 * signup.js
 * API call for creating accounts
 */

import { jsonError, withSessionCookie, base64ToArrayBuffer } from "../utils.js"

export async function signup(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		const { avatar, username } = await request.json();

		const normalizedUsername = username?.trim().toLowerCase();
		const validationError = validateSignup(avatar, normalizedUsername);
		if (validationError) return jsonError(validationError);

		// Check username availability
		const existingUsername = await env.USERNAMES.get(normalizedUsername);
		if (existingUsername) return jsonError("This username already exists");

		// Get session
		const cookie = request.headers.get("Cookie") || "";
		const token = cookie.match(/sessionToken=([^;]+)/)?.[1];
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

		// Generate userId
		const userId = crypto.randomUUID();

		// Upload avatar to R2
		const avatarBuffer = base64ToArrayBuffer(avatar);
		const avatarKey = `avatars/${userId}.jpg`;
		await env.ASSETS.put(avatarKey, avatarBuffer, {
			httpMetadata: { contentType: "image/jpeg" }
		});

		// Create user record
		const user = {
			id: userId,
			email: normalizedEmail,
			name: name,
			username: normalizedUsername,
			avatar: avatarKey,
			role: "user",
			interests: [],
			oauth: true
		};

		// Store data
		await env.USERS.put(userId, JSON.stringify(user));
		await env.EMAILS.put(normalizedEmail, userId);
		await env.USERNAMES.put(normalizedUsername, userId);

		// Upgrade session to permanent
		await env.SESSIONS.delete(token);
		const newToken = crypto.randomUUID();
		const maxAge = 60 * 60 * 24 * 7;
		await env.SESSIONS.put(newToken, userId, { expirationTtl: maxAge });
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
