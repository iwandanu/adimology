import { NextRequest, NextResponse } from 'next/server';
import { analyzeBandarmology } from '@/lib/bandarmology';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten');
    const days = parseInt(searchParams.get('days') || '10', 10);

    if (!emiten) {
      return NextResponse.json(
        { success: false, error: 'Emiten parameter is required' },
        { status: 400 }
      );
    }

    const result = await analyzeBandarmology(emiten.toUpperCase(), Math.min(days, 30));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Bandarmology API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze bandarmology',
      },
      { status: 500 }
    );
  }
}
