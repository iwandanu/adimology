import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_stock_queries')
      .select('id, emiten, created_at, user_id, user_profiles ( email )')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('query-log error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load query log' },
        { status: 500 }
      );
    }

    const items =
      (data || []).map((row: any) => ({
        id: row.id,
        emiten: row.emiten,
        created_at: row.created_at,
        user_id: row.user_id,
        email: row.user_profiles?.email ?? null,
      })) ?? [];

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error('query-log unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Unexpected error loading query log' },
      { status: 500 }
    );
  }
}

