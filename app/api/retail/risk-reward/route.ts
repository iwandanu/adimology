import { NextRequest, NextResponse } from 'next/server';
import { fetchRetailRiskReward } from '@/lib/datasaham';
import { fetchFeatureFlags } from '@/lib/featureFlags';
import { isAdminRequest } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const flags = await fetchFeatureFlags();
    if (!flags.api_retail_opportunity) {
      const isAdmin = await isAdminRequest(request);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'This feature is temporarily disabled.' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'symbol query parameter is required' },
        { status: 400 }
      );
    }

    const raw = await fetchRetailRiskReward(symbol);

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Retail Risk-Reward API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Retail risk-reward API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch retail risk-reward analysis',
      },
      { status: 500 }
    );
  }
}

