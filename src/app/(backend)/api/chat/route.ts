import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai.service';
import { ChatRequestPayload } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as ChatRequestPayload;
    
    if (!json.messages || !Array.isArray(json.messages) || json.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: messages array is required.' },
        { status: 400 }
      );
    }

    const responseText = await AIService.generateChatResponse(json.messages);

    return NextResponse.json({ message: responseText });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
