import { NextRequest, NextResponse } from 'next/server';
import { runScreener } from '@/lib/screener';
import type { ScreenerPreset } from '@/lib/screener';
import { UNIVERSES } from '@/lib/universes';
import {
  isOHLCConfigured,
  fetchConstituents,
  fetchSecurities,
} from '@/lib/ohlcDev';

async function resolveUniverseTickers(universe: string): Promise<string[]> {
  const fallback = UNIVERSES[universe] ?? UNIVERSES.lq45;
  if (!isOHLCConfigured()) return fallback;

  try {
    if (universe === 'lq45') {
      const tickers = await fetchConstituents('LQ45');
      return tickers.length > 0 ? tickers : fallback;
    }
    if (universe === 'idx80') {
      const tickers = await fetchConstituents('IDX80');
      return tickers.length > 0 ? tickers : fallback;
    }
    if (universe === 'all') {
      const tickers = await fetchSecurities({ start: 0, length: 2000 });
      return tickers.length > 0 ? tickers : fallback;
    }
  } catch (e) {
    console.warn('[Screen] OHLC universe fetch failed, using static:', e);
  }
  return fallback;
}

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

    const tickers = await resolveUniverseTickers(universe);

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
