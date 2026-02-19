import { NextRequest, NextResponse } from 'next/server';
import { getEmitenSummaryStats } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    // Validate limit (3, 5, 10, 20, 50 as requested)
    const validLimits = [3, 5, 10, 20, 50];
    const finalLimit = validLimits.includes(limit) ? limit : 5;

    const data = await getEmitenSummaryStats(finalLimit);

    return NextResponse.json({
      success: true,
      data,
      limit: finalLimit
    });

  } catch (error) {
    console.error('Error in summary API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
