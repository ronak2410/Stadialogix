import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import stadiumData from '@/data/stadium_data.json';
import { checkRateLimit, getClientKey, SECURITY_HEADERS } from '@/utils/requestGuards';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateWithRetry(model: string, contents: string, config: Record<string, unknown>, maxRetries = 3) {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (error: unknown) {
      lastError = error;
      const err = error as { status?: number; message?: string };
      if (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand') || err?.status === 429) {
        console.log(`API availability issue in staff route, retrying (${i + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, 2000 * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

const fallbackAlerts = [
  {
    type: 'CROWD CONTROL',
    severity: 'HIGH',
    title: 'Verizon Gate Bottleneck',
    description: 'Crowd density is at 85% and queue time is 12 minutes. Wait times are exceeding thresholds.',
    action: 'Reroute incoming fans to SAP Gate (4m wait time) using digital signage.',
  },
  {
    type: 'SANITATION',
    severity: 'MEDIUM',
    title: 'Restroom 101 Maintenance',
    description: 'Waste bin capacity has reached 95% at Section 101.',
    action: 'Dispatch sanitation team to Section 101 immediately.',
  },
];

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(`staff:${getClientKey(req.headers)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { alerts: fallbackAlerts, error: 'Too many requests. Showing cached fallback alerts.' },
      { status: 429, headers: SECURITY_HEADERS }
    );
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ alerts: fallbackAlerts }, { headers: SECURITY_HEADERS });
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
                  type: { type: Type.STRING, description: 'e.g., CROWD CONTROL, SANITATION, SECURITY' },
                  severity: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW' },
                  title: { type: Type.STRING, description: 'A short bold title for the alert' },
                  description: { type: Type.STRING, description: 'Detailed explanation of the predicted issue based on the data' },
                  action: { type: Type.STRING, description: 'Prescriptive action for the staff to take' },
                },
              },
            },
          },
        },
      }
    );

    const output = response.text;
    if (output) {
      return NextResponse.json(JSON.parse(output), { headers: SECURITY_HEADERS });
    }

    return NextResponse.json({ alerts: fallbackAlerts }, { headers: SECURITY_HEADERS });
  } catch (error: unknown) {
    console.error('Error in staff route, falling back to mock response:', error);
    return NextResponse.json({ alerts: fallbackAlerts }, { headers: SECURITY_HEADERS });
  }
}
