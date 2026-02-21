import { NextRequest, NextResponse } from 'next/server';
import { fetchYahooHistorical } from '@/lib/yahooFinance';
import { generateTradingPlan } from '@/lib/tradingPlan';
import { calculateATR, type OHLCData } from '@/lib/technical';

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
      const data = await fetchYahooHistorical(emiten.toUpperCase(), 60);

      if (data && data.length >= 15) {
        historicalData = data;
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
