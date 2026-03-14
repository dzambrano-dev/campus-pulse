/**
 * createEvent.js
 * API call to generate a new event
 */

import { requireRole, jsonError } from "./utils.js";

export async function createEvent(request, env) {
	const user = await requireRole(request, env, ["organizer", "admin"]);
	if (user.error) { return jsonError(user.error, user.status); }

	// User is now authorized
}
