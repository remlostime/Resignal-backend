const bucket = new Map();
export function rateLimit(clientId, limit = 20) {
    const now = Date.now();
    const windowMs = 60_000;
    const record = bucket.get(clientId);
    if (!record || now - record.time > windowMs) {
        bucket.set(clientId, { count: 1, time: now });
        return true;
    }
    if (record.count >= limit) {
        return false;
    }
    record.count += 1;
    return true;
}
