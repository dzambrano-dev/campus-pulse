export async function signup(request, env) {
	if (request.method !== "POST") {
		return jsonError("Method not allowed", 405);
	}

	try {
		let { username, email, password } = await request.json();

		// Normalize inputs
		username = username?.trim().toLowerCase();
		email = email?.trim().toLowerCase();
		password = password?.trim();

		// Validate signup
		const validationError = validateSignup(username, email, password);
		if (validationError) { return jsonError(validationError, 400); }

		// Check if username exists
		const existingUser = await env.USERS.get(username);
		if (existingUser) { return jsonError("User already exists"); }

		// Check if email exists
		const emailKey = `${email.toLowerCase()}`;
		const existingEmail = await env.EMAILS.get(emailKey);
		if (existingEmail) { return jsonError("Email already registered"); }

		// Hash password
		const passwordHash = await hashPassword(password);

		// Create user object
		const newUser = {
			username,
			email,
			passwordHash,
			interests: []
		};

		// Save user
		await env.USERS.put(username, JSON.stringify(newUser));

		// Save email lookup
		await env.EMAILS.put(emailKey, username);

		// Generate token
		const token = crypto.randomUUID();
		const week = 60 * 60 * 24 * 7
		await env.SESSIONS.put(token, username, { expirationTtl: week });

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

// Validation Helpers
function validateSignup(username, email, password) {
    if (!username || !email || !password ) { return "Missing required fields"; }
    if (!validateUsername(username)) { return "Username must be 5-20 characters and contain only letters or numbers"; }
    if (!validateEmail(email)) { return "Invalid email address"; }
    if (!validatePassword(password)) { return "Password must be 3-16 characters"; }
    return null;
}

function validateUsername(username) {
    return /^[a-zA-Z0-9]{5,20}$/.test(username);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password.length >= 3 && password.length <= 16;
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
