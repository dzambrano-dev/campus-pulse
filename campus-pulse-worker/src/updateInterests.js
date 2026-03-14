/**
 * updateInterests.js
 * API call for updating a user's interests
 */

import { json, jsonError, getSessionUser } from "./utils.js";

export async function updateInterests(request, env) {
	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		// Authenticate user using session token
		const username = await getSessionUser(request, env);
		if (!username) return jsonError("Invalid session", 401);

		// Parse request
		const { interests } = await request.json();

		// Validate interests
		if (!Array.isArray(interests)) return jsonError("Invalid request", 400);

		// Sanitize interests
		const cleanedInterests = interests.filter(i => typeof i === "string").map(i => i.trim()).filter(i => i.length > 0);

		// Retrieve user from KV
		const storedUser = await env.USERS.get(username);
		if (!storedUser) return jsonError("User not found", 404);

		const user = JSON.parse(storedUser);

		// Update user interests
		user.interests = cleanedInterests;

		// Save updated user to KV
		await env.USERS.put(username, JSON.stringify(user));
		return json({ success: true, cleanedInterests });
	} catch {
		// Handle unexpected errors
		return jsonError("Server error", 500);
	}
}
