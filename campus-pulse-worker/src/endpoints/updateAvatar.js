/**
 * updateAvatar.js
 * Allows a user to update their avatar
 */

import { json, jsonError, getSessionUser } from "../utils.js";

export async function updateAvatar(request, env) {
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		const userId = await getSessionUser(request, env);
		if (!userId) return jsonError("Invalid session", 401);

		const storedUser = await env.USERS.get(userId);
		if (!storedUser) return jsonError("User not found", 404);

		const user = JSON.parse(storedUser);

		const formData = await request.formData();
		const file = formData.get("avatar");

		if (!file) return jsonError("Missing avatar file", 400);
		if (!file.type.startsWith("image/")) {
			return jsonError("Invalid file type", 400);
		}

		// Overwrite current R2 file
		const key = `${userId}.webp`;

		await env.ASSETS.put(key, file.stream(), {
			httpMetadata: {
				contentType: file.type
			}
		});

		// Update user record
		user.avatar = key;
		await env.USERS.put(userId, JSON.stringify(user));

		return json({
			success: true,
			avatar: key
		});

	} catch (err) {
		console.error("updateAvatar error:", err);
		return jsonError("Invalid request");
	}
}
