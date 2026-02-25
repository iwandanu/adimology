import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      emiten,
      fromDate,
      toDate,
      source,
    } = body as {
      userId?: string;
      emiten?: string;
      fromDate?: string;
      toDate?: string;
      source?: string;
    };

    if (!userId || !emiten) {
      return NextResponse.json(
        { success: false, error: 'userId and emiten are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('user_stock_queries').insert({
      user_id: userId,
      emiten: emiten.toUpperCase(),
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      source: source ?? null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('log-query insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to log stock query' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('log-query error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error in log-query' },
      { status: 500 }
    );
  }
}

