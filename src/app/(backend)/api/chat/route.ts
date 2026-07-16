import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { checkRateLimit, getClientKey, SECURITY_HEADERS, validateChatPayload } from '@/utils/requestGuards';

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(getClientKey(req.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: SECURITY_HEADERS }
    );
  }

  try {
    const validation = validateChatPayload(await req.json());
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const responseText = await AIService.generateChatResponse(validation.messages);

    return NextResponse.json(
      { message: responseText },
      { headers: SECURITY_HEADERS }
    );
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Unable to process chat request right now.' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
