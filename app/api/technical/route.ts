import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalSummary } from '@/lib/stockbit';
import { analyzeTechnical, type OHLCData } from '@/lib/technical';

function toOHLC(item: {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}): OHLCData {
  return {
    date: item.date,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten');

    if (!emiten) {
      return NextResponse.json(
        { success: false, error: 'Emiten parameter is required' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 150);

    const raw = await fetchHistoricalSummary(
      emiten.toUpperCase(),
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      120
    );

    if (!raw || raw.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient historical data for technical analysis (min 50 days)',
      }, { status: 400 });
    }

    const data = raw.map(toOHLC).reverse();
    const analysis = analyzeTechnical(data);

    return NextResponse.json({
      success: true,
      data: {
        emiten: emiten.toUpperCase(),
        currentPrice: data[data.length - 1]?.close ?? 0,
        ...analysis,
      },
    });
  } catch (error) {
    console.error('Technical API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze technical',
      },
      { status: 500 }
    );
  }
}
