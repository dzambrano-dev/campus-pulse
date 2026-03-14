/**
 * utils.js
 * Shared API helpers
 */

import bcrypt from "bcryptjs"

// Create a JSON response with content-type header
export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

// Create an error response
export function jsonError(message, status = 400) {
    return json({ error: message });
}

// Hash a password using bcrypt
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10)
}

// Verify a password against a bcrypt hash
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
}

// Resolve user from auth token
export async function getSessionUser(request, env) {
    const auth = request.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) { return null; }
    const token = auth.replace("Bearer ", "");
    return await env.SESSIONS.get(token);
}

// Validate user role
export async function requireRole(request, env, allowedRoles) {
	const username = await getSessionUser(request, env);
	if (!username) return { error: "Unauthorized", status: 401 };

	const storedUser = await env.USERS.get(username);
	if (!storedUser) return { error: "User not found", status: 404 };

	const user = JSON.parse(storedUser);

	if (!allowedRoles.includes(user.role)) {
		return { error: "Forbidden", status: 403 };
	}

	return user;
}
