/**
 * getEvent.js
 * API call for fetching a single event
 */


import { json, jsonError, getSessionUser } from "../utils.js";


export async function getEvent(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	try {
		// Authenticate session
		const username = await getSessionUser(request, env);
		if (!username) return jsonError("Invalid session", 401);

		// Parse ID from query
		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		if (!id) return jsonError("Missing event ID", 400);

		// Fetch event from KV
		const event = await env.EVENTS.get(id, "json");
		if (!event) return jsonError("Event not found", 404);

		// Return event
		return json({ id: event.id || id, ...event });
	} catch (err) {
		console.error("getEvent error:", err);
		return jsonError("Failed to load event");
	}
}
