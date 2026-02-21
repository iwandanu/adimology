import { NextRequest, NextResponse } from 'next/server';
import { getCorporateActions } from '@/lib/corporateActions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emiten = searchParams.get('emiten');

    if (!emiten) {
      return NextResponse.json(
        { success: false, error: 'emiten parameter is required' },
        { status: 400 }
      );
    }

    const data = await getCorporateActions(emiten.toUpperCase());

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Corporate actions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch corporate actions',
      },
      { status: 500 }
    );
  }
}
