/**
 * index.js
 * API entrypoint for Cloudflare Workers
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 * API URL: https://campus-pulse-worker.vindictivity.workers.dev/api
 */

import { createEvent } from "./endpoints/createEvent.js";
import { getEvent } from "./endpoints/getEvent.js";
import { getEvents } from "./endpoints/getEvents.js";
import { getInterests } from "./endpoints/getInterests.js";
import { login } from "./endpoints/login.js";
import { logout } from "./endpoints/logout.js";
import { toggleOrganizer } from "./endpoints/toggleOrganizer.js";
import { signup } from "./endpoints/signup.js";
import { updateInterests } from "./endpoints/updateInterests.js";
import { user } from "./endpoints/user.js";


const corsHeaders = {
	"Access-Control-Allow-Origin": "https://dzambrano-dev.github.io",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Credentials": "true"
}


export default {
	async fetch(request, env) {
		// Handle browser preflight request (OPTIONS)
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// Parse the request URL to find the route
		const url = new URL(request.url);

		// Route each request to the appropriate handler
		// Unknown routes return 404
		switch (url.pathname) {
			case "/api/create-event": return addCors(await createEvent(request, env));
			case "/api/get-event": return addCors(await getEvent(request, env));
			case "/api/get-events": return addCors(await getEvents(request, env));
			case "/api/get-interests": return addCors(await getInterests(request, env));
			case "/api/login": return addCors(await login(request, env));
			case "/api/logout": return addCors(await logout(request, env));
			case "/api/signup": return addCors(await signup(request, env));
			case "/api/toggle-organizer": return addCors(await toggleOrganizer(request, env));
			case "/api/user": return addCors(await user(request, env));
			case "/api/update-interests": return addCors(await updateInterests(request, env));
			case "/api/health": return addCors(Response.json({ status: "OK" }));  // Used to check if API is alive
			default: return new Response("Not Found", { status: 404, headers: corsHeaders });
		}
	},
};

// Add CORS headers to a response
function addCors(response) {
	const headers = new Headers(response.headers);

	// Attach all defined CORS headers
	for (const [k, v] of Object.entries(corsHeaders)) {
		headers.set(k, v);
	}

	// Return a new response with updated headers
	return new Response(response.body, {
		status: response.status,
		headers: headers
	});
}
