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

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		switch (url.pathname) {
			case "/api/signup": return signup(request, env);
			case "/api/login": return login(request, env);
			case "/api/health": return Response.json({ status: "OK" });
			default: return new Response("Not Found", { status: 404 });
		}
	},
};
