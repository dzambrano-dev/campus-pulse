/**
 * deleteEvent.js
 * API call to delete an event
 */


import { requireRole, json, jsonError } from "../utils.js";


export async function deleteEvent(request, env) {
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

	await env.EVENTS.delete(id);

	return json({ success: true });
}
