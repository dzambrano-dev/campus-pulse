/**
 * createEvent.js
 * API call to generate a new event
 */

import { requireRole, json, jsonError } from "./utils.js";

export async function createEvent(request, env) {
	// Require organizer or admin role
	const user = await requireRole(request, env, ["organizer", "admin"]);
	if (user.error) return jsonError(user.error, user.status);

	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	// User is now authorized
	try {
		const body = await request.json();
		const { title, description, tags, datetime, location, lat, lng, image } = body;

		// Basic validation
		if (!title || !description || !tags || !datetime || !location || !lat || !lng) {
			return jsonError("Missing required fields", 400);
		}

		// Require at least one tag
		if (!Array.isArray(tags) || tags.length === 0) {
			return jsonError("Event must include at least one tag", 400);
		}

		// Generate event ID
		const eventId = crypto.randomUUID();
		const event = {
			title: title,
			description: description,
			tags: tags,
			datetime: datetime,
			location: location,
			lat: lat,
			lng: lng,
			image: image || null,
			createdBy: user.username,
			createdAt: new Date().toISOString()
		};

		// Store event in EVENTS KV
		await env.EVENTS.put(eventId, JSON.stringify(event));

		// Update tag indexes
		for (const tag of tags) {
			const storedIndex = await env.EVENTS_INDEX.get(tag, "json") || [];

			// Avoid duplicate IDs
			if (!storedIndex.includes(eventId)) {
				storedIndex.push(eventId);
			}

			await env.EVENTS_INDEX.put(tag, JSON.stringify(storedIndex));
		}

		return json({ success: true, event });
	} catch (err) {
		console.error("createEvent error:", err);
		return jsonError("Invalid request body");
	}
}
