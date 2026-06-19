/**
 * user.js
 * API call for looking up current user
 */

import { json, jsonError, getSessionUser } from "../utils.js";

export async function user(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	// Authenticate user using session token
	const userId = await getSessionUser(request, env);
	if (!userId) return jsonError("Invalid session", 401);

	// Retrieve user record
	const storedUser = await env.USERS.get(userId);
	if (!storedUser) return jsonError("User not found", 404);

	const user = JSON.parse(storedUser);

	// Return public user info
	return json({
		id: user.id,
		username: user.username,
		role: user.role || "user",
		interests: user.interests || [],
		avatar: user.avatar
	});
}
