export async function user(request, env) {
	if (request.method !== "GET") {
		return jsonError("Method not allowed", 405);
	}

	const auth = request.headers.get("Authorization");

	if (!auth || !auth.startsWith("Bearer ")) {
		return jsonError("Unauthorized", 401);
	}

	const token = auth.replace("Bearer ", "");
	const username = await env.SESSIONS.get(token);

	if (!username) {
		return jsonError("Invalid session", 401);
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
}

function jsonError(message, status = 400) {
	return new Response(JSON.stringify({error: message}), {
		status,
		headers: {"Content-Type": "application/json"}
	});
}
