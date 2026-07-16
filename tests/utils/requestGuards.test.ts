import { describe, expect, it } from 'vitest';
import { checkRateLimit, validateChatPayload } from '@/utils/requestGuards';

describe('validateChatPayload', () => {
  it('accepts a valid chat payload', () => {
    const result = validateChatPayload({
      messages: [{ role: 'user', content: 'Where is Section 120?' }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages[0].content).toBe('Where is Section 120?');
    }
  });

  it('rejects unsupported roles and oversized content', () => {
    expect(validateChatPayload({ messages: [{ role: 'admin', content: 'x' }] }).ok).toBe(false);
    expect(validateChatPayload({ messages: [{ role: 'user', content: 'x'.repeat(4_001) }] }).ok).toBe(false);
  });

  it('rejects non-image data URLs', () => {
    const result = validateChatPayload({
      messages: [{ role: 'user', content: 'inspect this', image: 'data:text/html,<script>alert(1)</script>' }],
    });

    expect(result.ok).toBe(false);
  });
});

describe('checkRateLimit', () => {
  it('blocks requests after the per-window limit', () => {
    const key = `test-${crypto.randomUUID()}`;
    let lastResult = checkRateLimit(key, 1_000);

    for (let i = 0; i < 29; i += 1) {
      lastResult = checkRateLimit(key, 1_000);
    }

    expect(lastResult.allowed).toBe(true);
    expect(checkRateLimit(key, 1_000).allowed).toBe(false);
  });
});
