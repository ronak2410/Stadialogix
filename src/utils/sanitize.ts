import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // Basic fast escaping for SSR/server context if ever called there (DOMPurify needs a window, though JSDOM can be used)
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  // Safe DOM-based sanitization for client
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'div', 'span', 'h3', 'svg', 'path'],
    ALLOWED_ATTR: ['href', 'class', 'className', 'viewBox', 'fill', 'stroke', 'stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd'],
  });
};
