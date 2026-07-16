import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '@/services/ai.service';
import { ChatMessage } from '@/types';

// Mock the genai client
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({ text: 'Mocked AI response' }),
      };
    },
  };
});

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should fall back to offline mode for known keywords', () => {
    const response = AIService.getOfflineFallback('where is the bathroom');
    expect(response).toContain('[Offline Mode]');
    expect(response).toContain('restroom');
  });

  it('should default offline mode if no keyword matches', () => {
    const response = AIService.getOfflineFallback('hello there');
    expect(response).toBe('I am currently operating in offline mode. How can I assist you with MetLife Stadium?');
  });

  it('should throw error if Gemini key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(AIService.generateChatResponse([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('Gemini API Key is missing.');
  });
});
