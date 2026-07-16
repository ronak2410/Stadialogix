import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
  },
  writable: true,
});

// Mock SpeechSynthesisUtterance
((global as unknown) as Record<string, unknown>).SpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({}));

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
