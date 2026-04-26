import { NextRequest, NextResponse } from 'next/server';
import { fetchRetailBreakoutAlerts } from '@/lib/datasaham';
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

    const raw = await fetchRetailBreakoutAlerts(30);

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Retail Breakout Alerts API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Retail breakout alerts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch retail breakout alerts',
      },
      { status: 500 }
    );
  }
}

