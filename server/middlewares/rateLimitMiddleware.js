const buckets = new Map();

function pruneExpired(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function createRateLimiter({
  keyPrefix,
  windowMs,
  limit,
  resolveKey,
  message
}) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    pruneExpired(now);

    const identity = resolveKey(req);
    const bucketKey = `${keyPrefix}:${identity}`;
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (current.count >= limit) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message: message || "Terlalu banyak percobaan. Silakan coba lagi nanti."
      });
    }

    current.count += 1;
    buckets.set(bucketKey, current);
    return next();
  };
}
