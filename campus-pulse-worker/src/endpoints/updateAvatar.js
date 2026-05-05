/**
 * updateAvatar.js
 * Allows a user to update their avatar
 */

import { json, jsonError, getSessionUser, base64ToArrayBuffer } from "../utils.js";

export async function updateAvatar(request, env) {
	if (request.method !== "POST") return jsonError("Method not allowed", 405);

	try {
		// Authenticate user
		const userId = await getSessionUser(request, env);
		if (!userId) return jsonError("Invalid session", 401);

		// Get user
		const storedUser = await env.USERS.get(userId);
		if (!storedUser) return jsonError("User not found", 404);
		const user = JSON.parse(storedUser);

		// Parse JSON
		const { avatar } = await request.json();
		if (!avatar) return jsonError("Missing avatar file", 400);

		// Convert base64 to webp
		const buffer = base64ToArrayBuffer(avatar);

		// Overwrite current R2 file
		const key = `avatars/${userId}.webp`;

		await env.ASSETS.put(key, buffer, {
			httpMetadata: {
				contentType: "image/webp"
			}
		});

		// Update user record
		user.avatar = key;
		await env.USERS.put(userId, JSON.stringify(user));

		return json({
			success: true,
			avatar: key
		});
	} catch (error) {
		console.error("updateAvatar error:", error);
		return jsonError("Invalid request");
	}
}
