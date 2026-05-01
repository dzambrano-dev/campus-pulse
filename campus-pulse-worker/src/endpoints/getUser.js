/**
 * getUser.js
 * API call for looking up user info
 */

import { json, jsonError, getSessionUser } from "../utils.js";

export async function getUser(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	const url = new URL(request.url);
	const userId = url.searchParams.get("id");

	if (!userId) return jsonError("Missing user id", 400);
	const storedUser = await env.USERS.get(userId);
	if (!storedUser) return jsonError("User not found", 404);

	const user = JSON.parse(storedUser);

	return json({
		id: user.id,
		username: user.username,
		avatar: user.avatar,
		interests: user.interests
	});
}
