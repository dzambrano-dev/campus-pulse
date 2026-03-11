export async function user(request, env) {
	if (request.method !== "POST") {
		return jsonError("Method not allowed", 405);
	}

	try {
		const { username } = await request.json();

		if (!username) {
			return jsonError("Missing username", 400);
		}

		const storedUser = await env.USERS.get(username);

		if (!storedUser) {
			return jsonError("User not found", 404);
		}

		const user = JSON.parse(storedUser);

		return Response.json({
			username: user.username,
			interests: user.interests
		});
	} catch {
		return jsonError("Invalid request", 400);
	}
}
