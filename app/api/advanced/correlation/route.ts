import { NextRequest, NextResponse } from 'next/server';
import { fetchAdvancedCorrelation } from '@/lib/datasaham';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols') ?? '';
    const periodParam = searchParams.get('period_days');
    const periodDays = periodParam ? Number(periodParam) : undefined;

    if (!symbols.trim()) {
      return NextResponse.json(
        { success: false, error: 'symbols query parameter is required (comma-separated codes)' },
        { status: 400 }
      );
    }

    const raw = await fetchAdvancedCorrelation(symbols, periodDays);

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Advanced Correlation API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Advanced correlation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch correlation analysis',
      },
      { status: 500 }
    );
  }
}

