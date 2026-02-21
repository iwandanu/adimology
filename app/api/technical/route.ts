import { NextRequest, NextResponse } from 'next/server';
import { fetchYahooHistorical } from '@/lib/yahooFinance';
import { analyzeTechnical } from '@/lib/technical';

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

    const data = await fetchYahooHistorical(emiten.toUpperCase(), 150);

    if (!data || data.length < 35) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient historical data for technical analysis (min 35 days)',
      }, { status: 400 });
    }
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
