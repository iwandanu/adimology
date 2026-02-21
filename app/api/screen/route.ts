import { NextRequest, NextResponse } from 'next/server';
import { runScreener } from '@/lib/screener';
import type { ScreenerPreset } from '@/lib/screener';
import { UNIVERSES } from '@/lib/universes';

const VALID_PRESETS: ScreenerPreset[] = [
  'oversold',
  'overbought',
  'bullish',
  'bearish',
  'breakout',
  'momentum',
  'undervalued',
  'rsi_extreme',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get('preset') || 'oversold') as ScreenerPreset;
    const universe = searchParams.get('universe') || 'lq45';

    if (!VALID_PRESETS.includes(preset)) {
      return NextResponse.json(
        { success: false, error: `Invalid preset. Use: ${VALID_PRESETS.join(', ')}` },
        { status: 400 }
      );
    }

    const tickers = UNIVERSES[universe] || UNIVERSES.lq45;

    const results = await runScreener(tickers, preset);

    return NextResponse.json({
      success: true,
      data: {
        preset,
        universe,
        count: results.length,
        stocks: results,
      },
    });
  } catch (error) {
    console.error('Screen API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run screener',
      },
      { status: 500 }
    );
  }
}
