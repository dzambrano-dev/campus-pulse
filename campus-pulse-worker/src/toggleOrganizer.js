/**
 * toggleOrganizer.js
 * API call that allows admins to toggle a user's organizer status
 *
 * user -> organizer
 * organizer -> user
 *
 * Admin accounts cannot be modified
 */

import { json, jsonError, getSessionUser } from "./utils.js";

export async function toggleOrganizer(request, env) {
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		// Authenticate caller
		const adminUsername = await getSessionUser(request, env);
		if (!adminUsername) return jsonError("Invalid session", 401);

		// Retrieve admin user
		const storedAdmin = await env.USERS.get(adminUsername);
		if (!storedAdmin) return jsonError("User not found", 404);

		// Only allow admins to toggle roles
		const admin = JSON.parse(storedAdmin);
		if (admin.role !== "admin") return jsonError("Forbidden", 403);

		// Parse request body
		const { username } = await request.json();
		if (!username) return jsonError("Missing username");

		// Retrieve target user
		const storedUser = await env.USERS.get(username);
		if (!storedUser) return jsonError("User not found", 404);

		const user = JSON.parse(storedUser);

		// Prevent changes to admin accounts
		if (user.role === "admin") return jsonError("Cannot modify admin accounts");

		// Toggle role
		if (user.role === "user") {
			user.role = "organizer";
		} else if (user.role === "organizer") {
			user.role = "user";
		}

		// Save updated user
		await env.USERS.put(username, JSON.stringify(user));

		return json({
			success: true,
			username,
			role: user.role
		});
	} catch {
		return jsonError("Invalid request");
	}
}
