/**
 * getInterests.js
 * API call for fetching possible interests (tags)
 */

import { json, jsonError } from "./utils.js"

export async function getInterests(request, env) {
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	try {
		const stored = await env.INTERESTS.get("interests");

		if (!stored) return json([]);

		return json({ interests });
	} catch {
		return jsonError("Failed to load interests");
	}
}
