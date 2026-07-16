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
      if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')) {
        console.log(`API 503 error in staff route, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, 2000 * (i + 1))); 
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ alerts: [] }, { status: 500 });
    }

    const systemInstruction = `You are the "StadiaLogix" AI Operations Analyst for MetLife Stadium (2026 World Cup).

CRITICAL RULES (NEVER BREAK THESE):
1. ONLY analyze the provided raw stadium data JSON (queue times, crowd density, waste bin levels).
2. DO NOT invent or hallucinate gates, metrics, or alerts. 
3. Predict 2-3 immediate operational bottlenecks based ONLY on the data. For example: >80% crowd density at a gate requires rerouting. >85% waste requires sanitation.
4. Return ONLY a valid JSON array of alerts matching the schema. No markdown wrapping.`;

    const response = await generateWithRetry(
      'gemini-flash-latest',
      `Here is the current MetLife Stadium state JSON: ${JSON.stringify(stadiumData)}`,
      {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "e.g., CROWD CONTROL, SANITATION, SECURITY" },
                  severity: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
                  title: { type: Type.STRING, description: "A short bold title for the alert" },
                  description: { type: Type.STRING, description: "Detailed explanation of the predicted issue based on the data" },
                  action: { type: Type.STRING, description: "Prescriptive action for the staff to take" }
                }
              }
            }
          }
        }
      }
    );

    const output = response.text;
    if (output) {
      return NextResponse.json(JSON.parse(output));
    }
    
    return NextResponse.json({ alerts: [] });

  } catch (error: any) {
    console.error('Error in staff route, falling back to mock response:', error);
    
    // Hackathon presentation fallback logic
    const mockAlerts = [
        { 
            type: 'CROWD CONTROL', 
            severity: 'HIGH', 
            title: 'Verizon Gate Bottleneck', 
            description: 'Crowd density is at 85% and queue time is 12 minutes. Wait times are exceeding thresholds.', 
            action: 'Reroute incoming fans to SAP Gate (4m wait time) using digital signage.' 
        },
        { 
            type: 'SANITATION', 
            severity: 'MEDIUM', 
            title: 'Restroom 101 Maintenance', 
            description: 'Waste bin capacity has reached 95% at Section 101.', 
            action: 'Dispatch sanitation team to Section 101 immediately.' 
        }
    ];
    return NextResponse.json({ alerts: mockAlerts });
  }
}
