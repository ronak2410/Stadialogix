import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '@/services/ai.service';


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



  it('should throw error if Gemini key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(AIService.generateChatResponse([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow('Gemini API Key is missing.');
  });
});
