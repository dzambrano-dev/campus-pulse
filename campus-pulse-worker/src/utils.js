/**
 * utils.js
 * Shared API helpers
 */

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

// Hash a password using SHA-256
// Used when storing or verifying passwords
export async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Resolve user from auth token
export async function getSessionUser(request, env) {
	const auth = request.headers.get("Authorization");
	if (!auth || !auth.startsWith("Bearer ")) { return null; }
	const token = auth.replace("Bearer ", "");
	return await env.SESSIONS.get(token);
}
