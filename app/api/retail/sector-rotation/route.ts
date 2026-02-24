import { NextResponse } from 'next/server';
import { fetchRetailSectorRotation } from '@/lib/datasaham';

export async function GET() {
  try {
    const raw = await fetchRetailSectorRotation();

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datasaham Retail Sector Rotation API is not configured or returned no data',
        },
        { status: 500 }
      );
    }

    const envelope = raw as { success?: boolean; data?: unknown };
    const success = envelope.success ?? true;
    const data = envelope.data ?? raw;

    return NextResponse.json({ success, data });
  } catch (error) {
    console.error('Retail sector-rotation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch retail sector rotation',
      },
      { status: 500 }
    );
  }
}

