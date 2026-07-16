import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import stadiumData from '@/data/stadium_data.json';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



async function generateWithRetry(model: string, contents: any, config: any, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (error: any) {
      lastError = error;
      if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 429) {
        console.log(`API rate limit/503 error, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, 2000 * (i + 1))); 
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  let messages: any[] = [];
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

  try {
    const json = await req.json();
    messages = json.messages || [];

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    
    // Format payload for Multimodal Vision API
    let payloadContents: any = [];
    if (lastMessage.image) {
      // Extract base64 part
      const base64Data = lastMessage.image.split(',')[1];
      payloadContents.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      });
    }
    payloadContents.push(lastMessage.content);

    const response = await generateWithRetry(
      'gemini-flash-latest',
      payloadContents,
      {
        systemInstruction: systemInstruction,
      }
    );

    return NextResponse.json({ message: response.text });

  } catch (error: any) {
    console.error('Gemini failed. Attempting fallback to Groq...', error.message);
    
    // --- LLM ROUTING: GROQ FALLBACK ---
    if (process.env.GROQ_API_KEY) {
        try {
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
                        ...messages.map((m: any) => ({
                            role: m.role,
                            content: m.content
                        }))
                    ]
                })
            });

            if (groqResponse.ok) {
                const groqData = await groqResponse.json();
                return NextResponse.json({ message: groqData.choices[0].message.content });
            } else {
                console.error('Groq Fallback also failed:', await groqResponse.text());
            }
        } catch (groqError) {
            console.error('Groq Network Error:', groqError);
        }
    }

    console.log('Falling back to local dynamic offline mode.');
    
    // Dynamic Offline Mode Fallback
    const userText = messages[messages.length - 1].content.toLowerCase();
    let mockResponse = "I am currently operating in offline mode. How can I assist you with MetLife Stadium?";

    if (userText.includes('uber') || userText.includes('lyft') || userText.includes('rideshare') || userText.includes('car')) {
      mockResponse = "[Offline Mode] Rideshare pickup is located off-property at Meadowlands Racing. It is a 1.3-mile walk from the main gates.";
    } else if (userText.includes('train') || userText.includes('transit') || userText.includes('subway') || userText.includes('rail')) {
      mockResponse = "[Offline Mode] Please use the NJ Transit Meadowlands Rail Line. Be advised, the main concourse is currently heavily congested.";
    } else if (userText.includes('food') || userText.includes('pizza') || userText.includes('eat') || userText.includes('hungry')) {
      mockResponse = "[Offline Mode] Nonna's Pizzeria is located in the Lower Bowl Concourse near Section 113. The current wait time is approximately 5 minutes.";
    } else if (userText.includes('bathroom') || userText.includes('restroom') || userText.includes('toilet')) {
      mockResponse = "[Offline Mode] The nearest restroom is located at Section 101. Current wait time is 8 minutes.";
    } else if (userText.includes('gate') || userText.includes('enter') || userText.includes('entrance')) {
      mockResponse = "[Offline Mode] Verizon Gate currently has a 12-minute wait. SAP Gate has a 4-minute wait and is recommended for faster entry.";
    } else if (userText.includes('wheelchair') || userText.includes('accessible') || userText.includes('handicap')) {
      mockResponse = "[Offline Mode] All main gates (Verizon and SAP) are wheelchair accessible. Accessible shuttles run from Lot E to the main entrances.";
    } else if (userText.match(/poem|song|messi|who won|joke/)) {
      mockResponse = "[Offline Mode] I am the StadiaLogix Assistant. I can only assist with navigation, accessibility, and operations for MetLife Stadium.";
    }
    
    return NextResponse.json({ message: mockResponse });
  }
}
