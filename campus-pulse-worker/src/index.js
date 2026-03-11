/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { login } from "./login.js";
import { signup } from "./signup.js";

const corsHeaders = {
	"Access-Control-Allow-Origin": "https://dzambrano-dev.github.io",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type"
}

export default {
	async fetch(request, env, ctx) {
		// Preflight request
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		switch (url.pathname) {
			case "/api/login":
				const loginResponse = await login(request, env);
				return addCors(loginResponse);
			case "/api/signup":
				const signupResponse = await signup(request, env);
				return addCors(signupResponse);
			case "/api/health": return Response.json({ status: "OK" });
			default: return new Response("Not Found", { status: 404, headers: corsHeaders });
		}
	},
};

function addCors(response) {
	const newHeaders = new Headers(response.headers);
	Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

	return new Response(response.body, {
		status: response.status,
		headers: newHeaders
	});
}
