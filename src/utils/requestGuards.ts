export const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientKey(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || headers.get('x-real-ip') || 'anonymous';
}

export function checkRateLimit(key: string, now = Date.now()) {
  const current = requestBuckets.get(key);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (current.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - current.count, resetAt: current.resetAt };
}

export function validateChatPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false as const, error: 'Request body must be a JSON object.' };
  }

  const messages = (payload as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false as const, error: 'Messages array is required.' };
  }

  if (messages.length > 20) {
    return { ok: false as const, error: 'Too many messages in one request.' };
  }

  const normalized = messages.map((message) => {
    if (!message || typeof message !== 'object') return null;
    const candidate = message as { role?: unknown; content?: unknown; image?: unknown };

    if (!['user', 'assistant', 'system'].includes(String(candidate.role))) return null;
    if (typeof candidate.content !== 'string' || candidate.content.length > 4_000) return null;

    if (candidate.image !== undefined) {
      if (typeof candidate.image !== 'string') return null;
      if (!candidate.image.startsWith('data:image/')) return null;
      if (candidate.image.length > 3_000_000) return null;
    }

    return {
      role: candidate.role as 'user' | 'assistant' | 'system',
      content: candidate.content.trim(),
      image: candidate.image as string | undefined,
    };
  });

  if (normalized.some((message) => message === null)) {
    return { ok: false as const, error: 'Messages must include valid role/content fields.' };
  }

  return { ok: true as const, messages: normalized as NonNullable<(typeof normalized)[number]>[] };
}
