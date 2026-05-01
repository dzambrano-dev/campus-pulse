/**
 * getUserId.js
 * API call for looking up user ids
 */

import { json, jsonError } from "../utils.js";

export async function getUserId(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	const url = new URL(request.url);
	const username = url.searchParams.get("username");
	if (!username) return jsonError("Missing username", 400);
	const normalized = username.trim().toLowerCase();
	const userId = await env.USERNAMES.get(normalized);
	if (!userId) return jsonError("User not found", 404);

	return json({ userId });
}
