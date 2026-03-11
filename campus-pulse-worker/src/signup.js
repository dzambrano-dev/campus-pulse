/**
 * signup.js
 * API call for creating accounts
 */

import { json, jsonError, hashPassword } from "./utils.js"

export async function signup(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		// Parse request
		let { username, email, password } = await request.json();

		// Normalize inputs
		username = username?.trim().toLowerCase();
		email = email?.trim().toLowerCase();
		password = password?.trim();

		// Validate signup data
		const validation = validateSignup(username, email, password);
		if (validation) return jsonError(validation);

		// Ensure username is not taken
		const existingUser = await env.USERS.get(username)
		if (existingUser) return jsonError("This username already exists");

		// Ensure email is not registered
		const existingEmail = await env.EMAILS.get(email);
		if (existingEmail) return jsonError("This email is already registered");

		// Hash password before storing
		const passwordHash = await hashPassword(password);

		// Create user record
		const newUser = {
			username,
			email,
			passwordHash,
			interests: []
		};

		// Save username and email in KVs
		await env.USERS.put(username, JSON.stringify(newUser));
		await env.EMAILS.put(email, username);

		// Generate a session token
		const token = crypto.randomUUID();
		const week = 60 * 60 * 24 * 7

		// Store the token and return it to the client
		await env.SESSIONS.put(token, username, { expirationTtl: week });
		return json({ success: true, token });
	} catch (err) {
		// Handle unexpected errors
		return jsonError("Invalid request");
	}
}

// Validate signup and return an error if invalid
function validateSignup(username, email, password) {
    if (!username || !email || !password ) return "Missing required fields";
    if (!validateUsername(username)) return "Username must be 5-20 characters and contain only letters or numbers";
    if (!validateEmail(email)) return "Invalid email address";
    if (!validatePassword(password)) return "Password must be 3-16 characters";
    return null;
}

// Username must be alphanumeric and between 5 and 20 characters
function validateUsername(username) {
    return /^[a-zA-Z0-9]{5,20}$/.test(username);
}

// Basic email format
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Password must be between 3 and 16 characters
function validatePassword(password) {
    return password.length >= 3 && password.length <= 16;
}
