export async function login(request, env) {
	if (request.method !== "POST") {
		return jsonError("Method not allowed", 405);
	}

	try {
		let { username, password } = await request.json();

		// Normalize inputs
		username = username?.trim().toLowerCase();
		password = password?.trim();

		// Prevent empty logins
		if (!username || !password) {
			return jsonError("Missing username or password");
		}

		let lookupUsername = username;

		// If input looks like an email, resolve it
		if (username.includes("@")) {
			const resolved = await env.EMAILS.get(username);
			if (!resolved) { return jsonError("Invalid username/email or password", 401); }
			lookupUsername = resolved;
		}

		// Retrieve user from KV
		const storedUser = await env.USERS.get(lookupUsername);
		if (!storedUser) {
			return jsonError("Invalid username or password", 401);
		}

		const user = JSON.parse(storedUser);

		// Hash incoming password
		const passwordHash = await hashPassword(password);

		// Compare hashes
		if (passwordHash !== user.passwordHash) {
			return jsonError("Invalid username or password", 401);
		}

		// Generate token
		const token = crypto.randomUUID();
		const week = 60 * 60 * 24 * 7
		await env.SESSIONS.put(token, lookupUsername, { expirationTtl: week });

		// Create a response
		return Response.json({
			success: true,
			token
		});

	} catch (err) {
		return jsonError("Invalid request", 400);
	}
}

// Password Encryption
async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Error Response
function jsonError(message, status = 400) {
	return new Response(JSON.stringify({
		error: message
	}), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
