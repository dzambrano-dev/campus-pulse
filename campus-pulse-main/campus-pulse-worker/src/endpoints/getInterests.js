/**
 * getInterests.js
 * API call for fetching all available interests (tags) on the platform
 */

import { json, jsonError } from "../utils.js"

export async function getInterests(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	try {
		const stored = await env.INTERESTS.get("interests");

		if (!stored) return json({ interests: [] });

		const interests = JSON.parse(stored);

		return json({ interests });
	} catch (err) {
		console.error("getInterests failed:", err);
		return jsonError("Failed to load interests");
	}
}
