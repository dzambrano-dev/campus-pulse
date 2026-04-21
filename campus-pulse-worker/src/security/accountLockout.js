/**
 * accountLocket.js
 * Account lockdown safety
 *
 * Rules:
 * - 5 failed attempts within 15 minutes locks accounts
 * - Lockdown times increase with repeated failures
 * - Everything resets at midnight
 */
import {user} from "../endpoints/user";

const MAX_ATTEMPTS = 5;

// Lockout escalation
const LOCKOUT_DURATIONS = [
	30,
	5 * 60,
	30 * 60,
	60 * 60,
	24 * 60 * 60
]

// Keys
const attemptsKey = (u) => `login_attempts:${u}`;
const lockKey = (u) => `login_lock:${u}`;
const countKey = (u) => `login_lock_count:${u}`;

// Seconds until midnight
function secondsUntilMidnight() {
	const now = new Date();
	const midnight = new Date();
	midnight.setHours(24, 0, 0, 0);
	return Math.floor((midnight - now) / 1000);
}

// Get lockout duration
async function getLockoutDuration(kv, username) {
	const raw = await kv.get(countKey(username));
	const count = raw ? parseInt(raw, 10) : 0;
	const index = Math.min(count, LOCKOUT_DURATIONS.length - 1);
	return { duration: LOCKOUT_DURATIONS[index], count };
}

// Check before login
export async function checkAccountLock(kv, username) {
	const raw = await kv.get(lockKey(username));
	if (!raw) return { locked: false };
	const { lockedAt } = JSON.parse(raw);
	const { duration } = await getLockoutDuration(kv, username);
	const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
	const remaining = duration - elapsed;
	if (remaining <= 0) {
		await kv.delete(lockKey(username));
		return { locked: false };
	}

	return { locked: true, retryAfter: remaining };
}

// Record failed login
export async function recordLoginFailure(kv, username) {
	const raw = await kv.get(attemptsKey(username));
	const attempts = raw ? parseInt(raw, 10) : 0;
	const newAttempts = attempts + 1;

	// Lockdown account
	if (newAttempts > MAX_ATTEMPTS) {
		const { duration, count } = await getLockoutDuration(kv, username);

		// Increase lockdown severity
		await kv.put(countKey(username), String(count + 1), {
			expirationTtl: secondsUntilMidnight()
		});

		// Lock
		await kv.put(lockKey(username), JSON.stringify({
			lockedAt: Date.now()
		}), {
			expirationTtl: duration
		});

		// Reset attempts
		await kv.delete(attemptsKey(username));
		return { locked: true, retryAfter: duration };
	}

	// Track failed attempts
	await kv.put(attemptsKey(username), String(nextAttempts), {
		expirationTtl: secondsUntilMidnight()
	});

	return {
		locked: false,
		remaining: MAX_ATTEMPTS - nextAttempts
	};
}

// Clear on successful login
export async function clearLoginFailures(kv, username) {
	await kv.delete(attemptsKey(username));
}
