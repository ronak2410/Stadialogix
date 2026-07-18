import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '@/types';
import stadiumData from '@/data/stadium_data.json';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `You are the "StadiaLogix" AI Smart Stadium Assistant for the 2026 FIFA World Cup, operating strictly at MetLife Stadium (New York New Jersey Stadium).

Here is the official stadium database you MUST use for all directions and answers:
${JSON.stringify(stadiumData)}

CRITICAL RULES (NEVER BREAK THESE):
1. OFF-TOPIC REJECTION: You MUST refuse any prompt that is not related to MetLife Stadium navigation, food, accessibility, or transit. If asked a general question (e.g., "Write a poem", "Who is Messi?", "What is 2+2?"), reply EXACTLY with: "I am the StadiaLogix Assistant. I can only assist with navigation, accessibility, and operations for MetLife Stadium. How can I help you find your way today?"
2. NO HALLUCINATION: Use the stadium database above. DO NOT invent gates, restrooms, or vendors. If a location is not in the database, state that it does not exist at this stadium.
3. TRANSIT RULES: For rideshare (Uber/Lyft), pickup is off-property at Meadowlands Racing (1.3 miles walk). For trains, use the NJ Transit Meadowlands Rail Line. 
4. VISION/IMAGE RULES: If the user uploads an image, analyze it to determine their location and provide routing assistance.
5. CONCISENESS: Keep answers to 2-3 short sentences. Do not ramble.
6. MULTILINGUAL SUPPORT: You MUST automatically detect the language of the user's prompt. You MUST reply in the exact same language they used (e.g., if they ask in Spanish, reply in Spanish).
7. GREEN FAN GAMIFICATION: If a user asks about transit/directions and you recommend taking the NJ Transit Rail Line (public transit), you MUST append the exact string "[AWARD_GREEN_POINTS]" to the very end of your response to reward them for their eco-friendly choice.
8. SEATING FORMULA (ALGORITHMIC ROUTING): If a user asks how to get to a specific seat (e.g., Section 113, Row M, Seat 22), use this formula: Rows go from A to Z (A is closest to the pitch, Z is highest). Seats 1-15 are on the left aisle of the section, Seats 16-30 are on the right aisle. Guide them accurately based on this math.
9. SECURITY RULES: If a fan asks to go to the Pitch, the Field, or the Team Dugouts, strictly refuse. Explain that these areas are restricted to players and credentialed staff only for security reasons.
10. AGENTIC ACTION (FOOD ORDERING): If a fan states they want food or a drink (e.g., "I want pizza", "Where are tacos?"), you MUST append the exact string "[RENDER_ORDER_CARD:ItemName]" to the very end of your response, replacing ItemName with what they want (e.g., "[RENDER_ORDER_CARD:Pizza]"). This will trigger the UI to render an interactive mobile ordering system.
11. AGENTIC ACTION (VIP & MERCH): If a fan asks to buy a jersey or merchandise, append "[RENDER_MERCH_CARD]" to the end of your response. If a fan asks about VIP access, suites, or upgrading their ticket, append "[RENDER_VIP_CARD]" to the end of your response.
12. LIVE MATCH DATA (FIFA 2026): You have access to real-time mock scoreboard data. The current match is USA vs Mexico. The score is USA 2 - 1 Mexico. The time is 84:12 (2nd Half). If the user asks who is winning, what the score is, or for match updates, provide this exact information dynamically.

EXAMPLES (FEW-SHOT):
User: "Write me a song about pizza."
Assistant: "I am the StadiaLogix Assistant. I can only assist with navigation, accessibility, and operations for MetLife Stadium. How can I help you find your way today?"

User: "Where can I get sushi?"
Assistant: "I checked the stadium directory, and there are no sushi vendors available at MetLife Stadium today. I can help you find pizza or hotdogs instead."`;

export class AIService {
  static async generateWithRetry(model: string, contents: (string | { inlineData: { data: string; mimeType: string } })[], config: Record<string, unknown>, maxRetries = 3): Promise<string> {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await ai.models.generateContent({ model, contents, config });
        return response.text || '';
      } catch (error: unknown) {
        lastError = error;
        const err = error as { status?: number; message?: string };
        if (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 429) {
          console.warn(`API rate limit/503 error, retrying (${i + 1}/${maxRetries})...`);
          await new Promise(res => setTimeout(res, 2000 * (i + 1))); 
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }

  static async getGroqFallback(messages: ChatMessage[]): Promise<string> {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages.map((m: ChatMessage) => ({
            role: m.role,
            content: m.content
          }))
        ]
      })
    });

    if (groqResponse.ok) {
      const groqData = await groqResponse.json();
      return groqData.choices[0].message.content;
    }
    throw new Error(await groqResponse.text());
  }

  static getOfflineFallback(userText: string): string {
    const lowerText = userText.toLowerCase();
    let mockResponse = "I am currently operating in offline mode. How can I assist you with MetLife Stadium?";

    if (lowerText.includes('uber') || lowerText.includes('lyft') || lowerText.includes('rideshare') || lowerText.includes('car')) {
      mockResponse = "[Offline Mode] Rideshare pickup is located off-property at Meadowlands Racing. It is a 1.3-mile walk from the main gates.";
    } else if (lowerText.includes('train') || lowerText.includes('transit') || lowerText.includes('subway') || lowerText.includes('rail')) {
      mockResponse = "[Offline Mode] Please use the NJ Transit Meadowlands Rail Line. Be advised, the main concourse is currently heavily congested.";
    } else if (lowerText.includes('food') || lowerText.includes('pizza') || lowerText.includes('eat') || lowerText.includes('hungry')) {
      mockResponse = "[Offline Mode] Nonna's Pizzeria is located in the Lower Bowl Concourse near Section 113. The current wait time is approximately 5 minutes.";
    } else if (lowerText.includes('bathroom') || lowerText.includes('restroom') || lowerText.includes('toilet')) {
      mockResponse = "[Offline Mode] The nearest restroom is located at Section 101. Current wait time is 8 minutes.";
    } else if (lowerText.includes('gate') || lowerText.includes('enter') || lowerText.includes('entrance')) {
      mockResponse = "[Offline Mode] Verizon Gate currently has a 12-minute wait. SAP Gate has a 4-minute wait and is recommended for faster entry.";
    } else if (lowerText.includes('wheelchair') || lowerText.includes('accessible') || lowerText.includes('handicap')) {
      mockResponse = "[Offline Mode] All main gates (Verizon and SAP) are wheelchair accessible. Accessible shuttles run from Lot E to the main entrances.";
    } else if (lowerText.match(/poem|song|messi|who won|joke/)) {
      mockResponse = "[Offline Mode] I am the StadiaLogix Assistant. I can only assist with navigation, accessibility, and operations for MetLife Stadium.";
    }
    
    return mockResponse;
  }

  static async generateChatResponse(messages: ChatMessage[], language?: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API Key is missing.');
    }

    const lastMessage = messages[messages.length - 1];
    
    const payloadContents: (string | { inlineData: { data: string; mimeType: string } })[] = [];
    if (lastMessage.image) {
      const base64Data = lastMessage.image.split(',')[1];
      payloadContents.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }
    payloadContents.push(lastMessage.content);

    try {
      return await this.generateWithRetry(
        'gemini-2.5-flash',
        payloadContents,
        { systemInstruction: language ? `${systemInstruction}\n\n13. LANGUAGE OVERRIDE: The user has selected the language code '${language}'. You MUST reply entirely in this language.` : systemInstruction }
      );
    } catch (error: unknown) {
      console.error('Gemini failed. Attempting fallback to Groq...', (error as Error).message);
      
      if (process.env.GROQ_API_KEY) {
        try {
          return await this.getGroqFallback(messages);
        } catch (groqError) {
          console.error('Groq Network Error:', groqError);
        }
      }

      console.warn('Falling back to local dynamic offline mode.');
      return this.getOfflineFallback(lastMessage.content);
    }
  }
}
