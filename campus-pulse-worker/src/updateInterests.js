export async function updateInterests(request, env) {
	if (request.method !== "POST") {
		return jsonError("Method not allowed", 405);
	}

	try {
		// Get auth token
		const auth = request.headers.get("Authorization");

		if (!auth || !auth.startsWith("Bearer ")) {
			return jsonError("Unauthorized", 401);
		}

		const token = auth.replace("Bearer ", "");

		// Resolve username from session
		const username = await env.SESSIONS.get(token);

		if (!username) {
			return jsonError("Invalid session", 401);
		}

		const { interests } = await request.json();

		// Validate inputs
		if (!Array.isArray(interests)) {
			return jsonError("Invalid request", 400);
		}

		if (interests.length < 3) {
			return jsonError("Select at least 3 interests");
		}

		// Retrieve user from KV
		const storedUser = await env.USERS.get(username);

		if (!storedUser) {
			return jsonError("User not found", 404);
		}

		const user = JSON.parse(storedUser);

		// Update interests
		user.interests = interests;

		// Save to KV
		await env.USERS.put(username, JSON.stringify(user));

		return Response.json({
			success: true,
			interests: user.interests,
		});
	} catch {
		return jsonError("Invalid request", 400);
	}
}

function jsonError(message, status = 400) {
	return new Response(JSON.stringify({
		error: message
	}), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
