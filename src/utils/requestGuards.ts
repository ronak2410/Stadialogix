export const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
import { z } from 'zod';

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

export const chatPayloadSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(4000),
      image: z.string().regex(/^data:image\//).max(3000000).optional(),
    })
  ).min(1).max(20),
  language: z.string().optional(),
});

export function validateChatPayload(payload: unknown) {
  try {
    const data = chatPayloadSchema.parse(payload);
    return { ok: true as const, messages: data.messages, language: data.language };
  } catch (error: any) {
    return { ok: false as const, error: error.errors?.[0]?.message || 'Invalid payload format' };
  }
}
