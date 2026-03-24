/**
 * rateLimit.js
 * Brute-force protection using Cloudflare KV with scaling lockout penalty.
 *
 * Lockout schedule:
 *   1st lockout →  30 seconds
 *   2nd lockout →   5 minutes
 *   3rd lockout →  30 minutes
 *   4th+ lockout →  1 hour
 */

const MAX_ATTEMPTS = 5; // failed attempts before lockout

// Scaling lockout durations in seconds
const LOCKOUT_SCHEDULE = [
	30,          // 1st lockout: 30 seconds
	5 * 60,      // 2nd lockout: 5 minutes
	30 * 60,     // 3rd lockout: 30 minutes
	60 * 60,     // 4th+ lockout: 1 hour
];

const WINDOW_SECONDS = 15 * 60; // sliding attempt window (15 min)

const attemptsKey     = (ip) => `attempts:${ip}`;
const lockoutKey      = (ip) => `lockout:${ip}`;
const lockoutCountKey = (ip) => `lockout_count:${ip}`;

/**
 * Get the lockout duration for an IP based on how many times
 * they've been locked out before.
 */
async function getLockoutDuration(kv, ip) {
	const raw = await kv.get(lockoutCountKey(ip));
	const count = raw ? parseInt(raw, 10) : 0;
	const index = Math.min(count, LOCKOUT_SCHEDULE.length - 1);
	return { duration: LOCKOUT_SCHEDULE[index], count };
}

/**
 * Check if an IP is currently rate-limited.
 * Call this BEFORE verifying credentials.
 */
export async function checkRateLimit(kv, ip) {
	const locked = await kv.get(lockoutKey(ip));
	if (locked) {
		const { lockedAt } = JSON.parse(locked);
		const { duration } = await getLockoutDuration(kv, ip);
		const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
		const retryAfter = Math.max(0, duration - elapsed);
		return { limited: true, retryAfter, remaining: 0 };
	}

	const raw = await kv.get(attemptsKey(ip));
	const attempts = raw ? parseInt(raw, 10) : 0;
	const remaining = Math.max(0, MAX_ATTEMPTS - attempts);

	if (attempts >= MAX_ATTEMPTS) {
		await triggerLockout(kv, ip);
		const { duration } = await getLockoutDuration(kv, ip);
		return { limited: true, retryAfter: duration, remaining: 0 };
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
		const { duration } = await triggerLockout(kv, ip);
		return { limited: true, retryAfter: duration, remaining: 0 };
	}

	await kv.put(attemptsKey(ip), String(newAttempts), {
		expirationTtl: WINDOW_SECONDS,
	});

	return { limited: false, retryAfter: 0, remaining: MAX_ATTEMPTS - newAttempts };
}

/**
 * Trigger a lockout for an IP, incrementing their lockout count.
 */
async function triggerLockout(kv, ip) {
	const { duration, count } = await getLockoutDuration(kv, ip);

	// Increment lockout count (keep for 30 days)
	await kv.put(lockoutCountKey(ip), String(count + 1), {
		expirationTtl: 60 * 60 * 24 * 30,
	});

	// Set lockout with the appropriate duration
	await kv.put(lockoutKey(ip), JSON.stringify({ lockedAt: Date.now() }), {
		expirationTtl: duration,
	});

	await kv.delete(attemptsKey(ip));

	return { duration };
}

/**
 * Clear rate limit state after a successful login.
 * Does NOT reset lockout count — repeat offenders stay tracked.
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
	const minutes = Math.ceil(retryAfter / 60);
	const message = retryAfter < 60
		? `Too many failed attempts. Try again in ${retryAfter} seconds.`
		: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;

	return new Response(
		JSON.stringify({ success: false, error: message, retryAfter }),
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
