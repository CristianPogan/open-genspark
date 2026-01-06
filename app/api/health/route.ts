import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasComposioKey: !!process.env.COMPOSIO_API_KEY,
        hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
}

