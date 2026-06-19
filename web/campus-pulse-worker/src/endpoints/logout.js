/**
 * logout.js
 * API call for logging out
 */

import {json, jsonError, parseCookies} from "../utils.js"

export async function logout(request, env) {
	// Only allow POST
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		const cookies = parseCookies(request.headers.get("Cookie"));
		const token = cookies.sessionToken;

		// Delete session from KV
		if (token) await env.SESSIONS.delete(token);

		// Clear cookie from browser
		return new Response(JSON.stringify({ success: true }), {
			headers: {
				"Content-Type": "application/json",
				"Set-Cookie": [
					"sessionToken=",
					"HttpOnly",
					"Secure",
					"SameSite=None",
					"Path=/",
					"Max-Age=0"
				].join("; ")
			}
		});
	} catch (err) {
		return json({ error: "Logout failed" }, 500);
	}
}
