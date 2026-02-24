import { NextResponse } from 'next/server';
import {
  fetchRetailMultibaggerScan,
} from '@/lib/datasaham';

export async function GET() {
  try {
    const raw = await fetchRetailMultibaggerScan(20);

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Retail Multibagger API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Retail multibagger API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch retail multibagger scan',
      },
      { status: 500 }
    );
  }
}

