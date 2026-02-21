import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalSummary } from '@/lib/stockbit';
import { generateTradingPlan } from '@/lib/tradingPlan';
import { calculateATR, type OHLCData } from '@/lib/technical';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      emiten,
      currentPrice,
      targetRealistis,
      targetMax,
      accountSize = 100_000_000,
    } = body;

    if (!emiten || !currentPrice || !targetRealistis || !targetMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: emiten, currentPrice, targetRealistis, targetMax',
        },
        { status: 400 }
      );
    }

    let atr: number | null = null;
    let historicalData: OHLCData[] | undefined;

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      const raw = await fetchHistoricalSummary(
        emiten.toUpperCase(),
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        60
      );

      if (raw && raw.length >= 15) {
        historicalData = raw.map(toOHLC).reverse();
        atr = calculateATR(historicalData, 14);
      }
    } catch {
      // Continue without ATR
    }

    const plan = generateTradingPlan({
      emiten: emiten.toUpperCase(),
      currentPrice: Number(currentPrice),
      targetRealistis: Number(targetRealistis),
      targetMax: Number(targetMax),
      atr: atr ?? undefined,
      historicalData,
      accountSize: Number(accountSize) || 100_000_000,
      riskPercent: 2,
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Trading plan API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate trading plan',
      },
      { status: 500 }
    );
  }
}
