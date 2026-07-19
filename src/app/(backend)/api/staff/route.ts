import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getIoTState } from '@/utils/iotState';
import { checkRateLimit, getClientKey, SECURITY_HEADERS } from '@/utils/requestGuards';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini retry logic removed, using Groq exclusively for Staff Dashboard

async function generateWithGroq(systemInstruction: string, currentState: any) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined');
  }

  const prompt = `${systemInstruction}\n\nHere is the current MetLife Stadium state JSON: ${JSON.stringify(currentState)}\n\nRespond ONLY with a JSON object containing an "alerts" array.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
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

    const systemInstruction = `You are the "StadiaLogix" AI Operations Analyst for MetLife Stadium (2026 World Cup).

CRITICAL RULES (NEVER BREAK THESE):
1. ONLY analyze the provided raw stadium data JSON (queue times, crowd density, waste bin levels).
2. DO NOT invent or hallucinate gates, metrics, or alerts.
3. Predict 2-3 immediate operational bottlenecks based ONLY on the data. For example: >80% crowd density at a gate requires rerouting. >85% waste requires sanitation. MUST explicitly include at least one SUSTAINABILITY alert (e.g. waste management or eco-transit).
4. Return ONLY a valid JSON array of alerts matching the schema. No markdown wrapping.`;

    const currentState = getIoTState();
    
    try {
      const groqAlerts = await generateWithGroq(systemInstruction, currentState);
      if (groqAlerts && groqAlerts.alerts) {
        return NextResponse.json(groqAlerts, { headers: SECURITY_HEADERS });
      }
    } catch (groqErr) {
      console.error('Groq generation failed in staff route:', groqErr);
    }
    
    return NextResponse.json({ alerts: fallbackAlerts }, { headers: SECURITY_HEADERS });
}
