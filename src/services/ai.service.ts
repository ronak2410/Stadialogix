import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '@/types';
import { getIoTState } from '@/utils/iotState';
import { getLiveMatchState } from '@/utils/matchState';

export async function generateFanResponse(userMessage: ChatMessage, chatHistory: ChatMessage[], activeLocation: string, language?: string) {
  const liveMatchState = getLiveMatchState();
  const liveIoTState = getIoTState();
  const systemInstruction = getFanSystemInstruction(activeLocation, liveMatchState, liveIoTState, language);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const mapMessageToParts = (msg: ChatMessage) => {
    const parts: any[] = [];
    if (msg.content) parts.push({ text: msg.content });
    if (msg.image) {
      const match = msg.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }
    return parts.length > 0 ? parts : [{ text: '' }];
  };

  // Convert history to Gemini format
  const history = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: mapMessageToParts(msg)
  }));
  
  // The @google/genai SDK doesn't have startChat for streaming directly in the same way,
  // we can just pass the contents array
  const contents = [
    ...history,
    { role: 'user', parts: mapMessageToParts(userMessage) }
  ];

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-1.5-flash',
    contents: contents as any,
    config: {
      systemInstruction: systemInstruction
    }
  });
  return responseStream;
}

function getFanSystemInstruction(activeLocation: string, liveMatchState: any, liveIoTState: any, language?: string) {
  return `You are the Fan Assistant for StadiaLogix (FIFA 2026) World Cup, operating strictly at MetLife Stadium (New York New Jersey Stadium).

Here is the official stadium database and real-time IoT state you MUST use for all directions and answers:
${JSON.stringify({ activeLocation, liveIoTState })}

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
12. LIVE MATCH DATA: You have access to real-time scoreboard data. The current match is ${liveMatchState.homeTeam} vs ${liveMatchState.awayTeam}. The score is ${liveMatchState.homeTeam} ${liveMatchState.homeScore} - ${liveMatchState.awayScore} ${liveMatchState.awayTeam}. The time is ${liveMatchState.clockDisplay}. If the user asks about the game, give them this exact real-time data.
13. MULTI-AGENT COLLABORATION: If a fan reports a hazard, spill, fight, or incident, you MUST append the exact string "[TRIGGER_OPS_ALERT:Description]" replacing Description with a short summary (e.g. "[TRIGGER_OPS_ALERT:Spill at Section 120]"). This payload is intercepted by the Staff Operations AI agent to dispatch a cleanup/security crew automatically.

EXAMPLES (FEW-SHOT):
User: "Write me a song about pizza."
Assistant: "I am the StadiaLogix Assistant. I can only assist with navigation, accessibility, and operations for MetLife Stadium. How can I help you find your way today?"

User: "Where can I get sushi?"
Assistant: "I checked the stadium directory, and there are no sushi vendors available at MetLife Stadium today. I can help you find pizza or hotdogs instead."`;
}

export class AIService {
  static async generateChatResponse(messages: ChatMessage[], language?: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API Key is missing.');
    }

    const lastMessage = messages[messages.length - 1];
    const chatHistory = messages.slice(0, -1);
    
    try {
      return await generateFanResponse(lastMessage, chatHistory, 'gate-verizon', language);
    } catch (geminiError) {
      console.warn("Gemini API failed, falling back to Groq:", geminiError);
      return await generateGroqFallback(lastMessage, chatHistory, 'gate-verizon', language);
    }
  }
}

async function* generateGroqFallback(userMessage: ChatMessage, chatHistory: ChatMessage[], activeLocation: string, language?: string) {
  const liveMatchState = getLiveMatchState();
  const liveIoTState = getIoTState();
  const systemInstruction = getFanSystemInstruction(activeLocation, liveMatchState, liveIoTState, language);
  
  const messages = [
    { role: "system", content: systemInstruction },
    ...chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || '[Image Attached]'
    })),
    { role: "user", content: userMessage.content || '[Image Attached]' }
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      stream: true,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    throw new Error(`Groq API Error: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  
  if (!reader) return;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
      if (line === 'data: [DONE]') continue;
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices[0]?.delta?.content;
          if (content) {
            yield { text: content };
          }
        } catch (e) {
          // Ignore parse errors on incomplete chunks
        }
      }
    }
  }
}
