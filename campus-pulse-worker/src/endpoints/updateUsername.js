/**
 * updateUsername.js
 * Allows a user to update their username
 */

import { json, jsonError, getSessionUser } from "../utils.js";

export async function updateUsername(request, env) {
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		// Authenticate user
		const userId = await getSessionUser(request, env);
		if (!userId) return jsonError("Invalid session", 401);

		const storedUser = await env.USERS.get(userId);
		if (!storedUser) return jsonError("User not found", 404);

		const user = JSON.parse(storedUser);

		const { username } = await request.json();
		if (!username) return jsonError("Missing username", 400);

		const normalized = username.trim().toLowerCase();

		// Check if username already exists
		const existing = await env.USERNAMES.get(normalized);
		if (existing && existing !== userId) {
			return jsonError("Username already taken", 400);
		}

		const oldUsername = user.username;

		// Skip if same username
		if (oldUsername === username) {
			return json({ success: true, username });
		}

		// Store previous usernames
		user.previous_usernames = [
			oldUsername,
			...(user.previous_usernames || [])
		];

		// Update username
		user.username = username;

		// Update KV mappings
		await env.USERNAMES.delete(oldUsername.toLowerCase());
		await env.USERNAMES.put(normalized, userId);
		await env.USERS.put(userId, JSON.stringify(user));

		return json({
			success: true,
			username
		});

	} catch (err) {
		console.error("updateUsername error:", err);
		return jsonError("Invalid request");
	}
}
