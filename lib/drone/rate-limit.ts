/**
 * lib/drone/rate-limit.ts
 *
 * A basic in-memory sliding-window limiter, global (not per-user/session —
 * this app has no auth). Good enough to stop accidental hammering during the
 * MVP demo. Known limitations, do not treat as production-grade:
 *  - Resets on every server restart / redeploy.
 *  - Shared across ALL visitors, not scoped per IP or session.
 *  - Lives in one process's memory — breaks down under multiple server
 *    instances or serverless (each instance gets its own counter).
 * A real deployment needs a shared store (e.g. Redis) keyed per user/IP.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestTimestamps: number[] = [];

/** Returns true if the request is allowed, false if the limit was hit. */
export function checkRateLimit(): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  requestTimestamps.push(now);
  return true;
}
