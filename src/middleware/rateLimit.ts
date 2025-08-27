const windowMs = 60_000;
const max = 30;

const ipHits = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = ipHits.get(ip);
  if (!existing || existing.expiresAt < now) {
    ipHits.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }
  existing.count += 1;
  if (existing.count > max) return false;
  return true;
}


