/**
 * createEvent.js
 * API call to generate a new event
 */


import { requireRole, json, jsonError, getSessionUser } from "../utils.js";


export async function createEvent(request, env) {
	// Require organizer or admin role
	const user = await requireRole(request, env, ["organizer", "admin"]);
	if (user.error) return jsonError(user.error, user.status);

	// Only allow POST requests
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	// User is now authorized
	try {
		const body = await request.json();
		const {
			title,
			description,
			type,
			tags,
			datetime,
			location,
			action,
			actionLink,
			actionLabel,
			lat,
			lng,
			image
		} = body;

		// Basic validation
		if (!title || !description || !type || !tags || !datetime || !location || !lat || !lng) {
			return jsonError("Missing required fields", 400);
		}

		// Require at least one tag
		if (!Array.isArray(tags) || tags.length === 0) {
			return jsonError("Event must include at least one tag", 400);
		}

		// Validate actions
		try {
			validateAction(action, actionLink, actionLabel);
		} catch (err) {
			return jsonError(err.message, err.status || 400);
		}
		const cleanLink = actionLink ? actionLink.trim() : null;
		const cleanLabel = actionLabel ? actionLabel.trim() : null;

		// Fetch username
		const username = await getSessionUser(request, env);
		if (!username) return jsonError("Unauthorized", 401);

		// Generate event ID
		const eventId = crypto.randomUUID();
		const event = {
			id: eventId,
			title: title,
			description: description,
			type: type,
			tags: tags,
			datetime: datetime,
			location: location,
			action: action || null,
			actionLink: cleanLink || null,
			actionLabel: action === "custom" ? cleanLabel : null,
			lat: lat,
			lng: lng,
			image: image || null,
			createdBy: username,
			createdAt: Math.floor(Date.now() / 1000)
		};

		// Store event in EVENTS KV
		await env.EVENTS.put(eventId, JSON.stringify(event));

		// Update tag indexes
		for (const tag of tags) {
			const storedIndex = await env.EVENTS_INDEX.get(tag.toLowerCase(), "json") || [];

			// Avoid duplicate IDs
			if (!storedIndex.includes(eventId)) {
				storedIndex.push(eventId);
			}

			await env.EVENTS_INDEX.put(tag, JSON.stringify(storedIndex));
		}

		return json({ success: true, event });
	} catch (err) {
		console.error("createEvent error:", err);
		return jsonError(err.message || "Invalid request body", err.status || 400);
	}
}


// Validate action
function validateAction(action, actionLink, actionLabel) {
	if (!action) return;

	const allowedActions = ["rsvp", "contact", "discord", "instagram", "custom"];
	if (!allowedActions.includes(action)) {
		throw { message: "Invalid action type", status: 400 };
	}

	// RSVP
	if (action === "rsvp") {
		if (actionLink || actionLabel) {
			throw { message: "RSVP should not include link or label", status: 400 };
		}
		return;
	}

	// All other actions require a link
	if (!actionLink) {
		throw { message: "Action link is required", status: 400 };
	}

	// Email validation
	if (action === "contact") {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(actionLink)) {
			throw { message: "Invalid email address", status: 400 };
		}
	}

	// URL validation
	if (["discord", "instagram", "custom"].includes(action)) {
		let url;
		try {
			url = new URL(actionLink);
		} catch {
			throw { message: "Invalid URL", status: 400 };
		}

		// Discord validation
		if (action === "discord" && !url.hostname.includes("discord")) {
			throw { message: "Invalid Discord link", status: 400 };
		}

		// Instagram validation
		if (action === "instagram" && !url.hostname.includes("instagram")) {
			throw { message: "Invalid Instagram link", status: 400 };
		}
	}

	// Custom validation
	if (action === "custom") {
		if (!actionLabel) {
			throw { message: "Custom button requires a label", status: 400 };
		}

		if (actionLabel.length > 16) {
			throw { message: "Custom label too long", status: 400 };
		}
	}
}
