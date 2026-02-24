import { NextRequest, NextResponse } from 'next/server';
import { fetchAdvancedMultiMarketScreener } from '@/lib/datasaham';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const commodityExposure = searchParams.get('commodityExposure') ?? undefined;
    const forexExposure = (searchParams.get('forexExposure') as
      | 'exporter'
      | 'importer'
      | 'all'
      | null) ?? undefined;
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const minVolumeParam = searchParams.get('minVolume');

    const raw = await fetchAdvancedMultiMarketScreener({
      commodityExposure,
      forexExposure,
      minPrice: minPriceParam ? Number(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
      minVolume: minVolumeParam ? Number(minVolumeParam) : undefined,
    });

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Datasaham Advanced Multi-Market Screener API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Advanced multi-market screener API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch multi-market screener results',
      },
      { status: 500 }
    );
  }
}

