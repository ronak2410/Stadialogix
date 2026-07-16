import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/utils/sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe tags like b, i, strong', () => {
    const input = '<b>Bold</b> <i>Italic</i> <strong>Strong</strong>';
    const result = sanitizeHtml(input);
    expect(result).toBe(input);
  });

  it('should remove dangerous tags like script', () => {
    const input = '<div><script>alert("XSS")</script><p>Safe</p></div>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<div><p>Safe</p></div>');
  });

  it('should remove inline event handlers', () => {
    const input = '<img src="x" onerror="alert(1)" /><a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    // DOMPurify removes img because we didn't allow it in ALLOWED_TAGS, and cleans a
    expect(result).toBe('<a>Click</a>');
  });

  it('should preserve allowed attributes like class and viewBox on SVG', () => {
    const input = '<svg class="icon" viewBox="0 0 24 24"><path d="M1 1"/></svg>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<svg class="icon" viewBox="0 0 24 24"><path d="M1 1"></path></svg>');
  });
});
