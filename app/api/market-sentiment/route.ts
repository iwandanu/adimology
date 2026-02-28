import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketSentiment } from '@/lib/datasaham';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const days = searchParams.get('days');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'symbol query parameter is required' },
        { status: 400 }
      );
    }

    const parsedDays = days ? parseInt(days, 10) : undefined;

    const raw = await fetchMarketSentiment(symbol, parsedDays);

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Market Sentiment API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Market sentiment API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch market sentiment analysis',
      },
      { status: 500 }
    );
  }
}
