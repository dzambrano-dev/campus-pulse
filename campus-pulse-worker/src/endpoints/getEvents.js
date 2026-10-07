/**
 * getEvents.js
 * API call for fetching events
 */

import { json, jsonError, getSessionUser } from "../utils.js";

export async function getEvents(request, env) {
	// Only allow GET requests
	if (request.method !== "GET") return jsonError("Method not allowed", 405);

	try {
		// Authenticate session
		const username = await getSessionUser(request, env);
		if (!username) return jsonError("Invalid session", 401);

		// Fetch user
		const userData = await env.USERS.get(username);
		if (!userData) return jsonError("User not found", 404);

		const user = JSON.parse(userData);
		const interests = user.interests || [];
		let eventIds = new Set();

		// If user has interests, use indexes
		if (interests.length > 0) {
			for (const interest of interests) {
				const index = await env.EVENTS_INDEX.get(interest.toLowerCase(), "json");
				if (!index) continue;
				index.forEach(id => eventIds.add(id));
			}
		} else {
			const emergencyIndex = await env.EVENTS_INDEX.get("emergency", "json");
			if (emergencyIndex) {
				emergencyIndex.forEach(id => eventIds.add(id));
			}
		}

		for (const id of eventIds) console.log("event id:", id);

		// Fetch events from EVENTS KV
		const events = await Promise.all(
			[...eventIds].map(async (id) => {
				const event = await env.EVENTS.get(id, "json");

				if (!event) return null;

				// Attach ID to event 
				return {
					id: event.id || id, // supports events
					...event
				};
			})
		);
		// Remove null entries (events that were deleted)
		const validEvents = events.filter(Boolean);

		// Sort events by date
		validEvents.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

		// Return events list
		return json(validEvents.slice(0, 50));
	} catch (err) {
		console.error("getEvents error:", err);
		return jsonError("Failed to load events");
	}
}
