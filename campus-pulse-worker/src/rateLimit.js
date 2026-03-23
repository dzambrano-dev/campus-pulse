/**
 * rateLimit.js
 * Brute-force protection using Cloudflare KV.
 * Uses a dedicated RATE_LIMIT_KV namespace (add binding to wrangler.jsonc).
 */

const MAX_ATTEMPTS = 5;         // failures before lockout
const WINDOW_SECONDS = 15 * 60; // sliding window (15 min)
const LOCKOUT_SECONDS = 60 * 60; // lockout duration (1 hour)

const attemptsKey = (ip) => `attempts:${ip}`;
const lockoutKey  = (ip) => `lockout:${ip}`;

/**
 * Check if an IP is currently rate-limited.
 * Call this BEFORE verifying credentials.
 */
export async function checkRateLimit(kv, ip) {
	const locked = await kv.get(lockoutKey(ip));
	if (locked) {
		const { lockedAt } = JSON.parse(locked);
		const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
		const retryAfter = Math.max(0, LOCKOUT_SECONDS - elapsed);
		return { limited: true, retryAfter, remaining: 0 };
	}

	const raw = await kv.get(attemptsKey(ip));
	const attempts = raw ? parseInt(raw, 10) : 0;
	const remaining = Math.max(0, MAX_ATTEMPTS - attempts);

	if (attempts >= MAX_ATTEMPTS) {
		await kv.put(lockoutKey(ip), JSON.stringify({ lockedAt: Date.now() }), {
			expirationTtl: LOCKOUT_SECONDS,
		});
		await kv.delete(attemptsKey(ip));
		return { limited: true, retryAfter: LOCKOUT_SECONDS, remaining: 0 };
	}

	return { limited: false, retryAfter: 0, remaining };
}

/**
 * Record a failed login attempt for an IP.
 * Call this when credentials are wrong.
 */
export async function recordFailedAttempt(kv, ip) {
	const raw = await kv.get(attemptsKey(ip));
	const attempts = raw ? parseInt(raw, 10) : 0;
	const newAttempts = attempts + 1;

	if (newAttempts >= MAX_ATTEMPTS) {
		await kv.put(lockoutKey(ip), JSON.stringify({ lockedAt: Date.now() }), {
			expirationTtl: LOCKOUT_SECONDS,
		});
		await kv.delete(attemptsKey(ip));
		return { limited: true, retryAfter: LOCKOUT_SECONDS, remaining: 0 };
	}

	await kv.put(attemptsKey(ip), String(newAttempts), {
		expirationTtl: WINDOW_SECONDS,
	});

	return { limited: false, retryAfter: 0, remaining: MAX_ATTEMPTS - newAttempts };
}

/**
 * Clear rate limit state after a successful login.
 */
export async function clearRateLimit(kv, ip) {
	await Promise.all([
		kv.delete(attemptsKey(ip)),
		kv.delete(lockoutKey(ip)),
	]);
}

/**
 * Standard 429 response with Retry-After header.
 */
export function rateLimitResponse(retryAfter) {
	return new Response(
		JSON.stringify({
			success: false,
			error: `Too many failed attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
			retryAfter,
		}),
		{
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"Retry-After": String(retryAfter),
				"Cache-Control": "no-store",
			},
		}
	);
}
