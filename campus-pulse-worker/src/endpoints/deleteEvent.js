/**
 * deleteEvent.js
 * API call to delete an event
 */


import { requireRole, json, jsonError } from "../utils.js";


export async function deleteEvent(request, env) {
	// Only allow DELETE requests
	if (request.method !== "DELETE") return jsonError("Method not allowed", 405);

	try {
		const user = await requireRole(request, env, ["organizer", "admin"]);
		if (user.error) return jsonError(user.error, user.status);

		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) return jsonError("Missing event id", 400);

		const event = await env.EVENTS.get(id, "json");
		if (!event) return jsonError("Event not found", 404);

		// Only creator or admin
		if (user.username !== event.createdBy && user.role !== "admin") {
			return jsonError("Unauthorized", 403);
		}

		// Delete from index
		for (const tag of event.tags) {
			const key = tag.toLowerCase();
			const index = await env.EVENTS_INDEX.get(key, "json") || [];
			const updated = index.filter(eid => eid !== id);
			await env.EVENTS_INDEX.put(key, JSON.stringify(updated));
		}

		// Delete from events
		await env.EVENTS.delete(id);

		return json({ success: true });
	} catch (err) {
		console.error("deleteEvent error:", err);
		return jsonError("Failed to load event");
	}
}
