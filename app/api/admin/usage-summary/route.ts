import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Count users
    const { count: userCount, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('Error counting users:', userError);
    }

    // Get last 500 queries to build stats in JS
    const { data: queries, error: queryError } = await supabase
      .from('user_stock_queries')
      .select('user_id, emiten, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (queryError) {
      console.error('Error fetching user_stock_queries:', queryError);
    }

    const totalQueries = queries?.length ?? 0;
    const uniqueUsersWithQueries = new Set<string>();
    const tickerCounts = new Map<string, number>();

    (queries || []).forEach((q) => {
      if (q.user_id) uniqueUsersWithQueries.add(q.user_id);
      const sym = (q.emiten || '').toUpperCase();
      if (!sym) return;
      tickerCounts.set(sym, (tickerCounts.get(sym) || 0) + 1);
    });

    const topTickers = Array.from(tickerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emiten, count]) => ({ emiten, count }));

    return NextResponse.json({
      success: true,
      data: {
        userCount: userCount ?? 0,
        totalQueries,
        usersWithQueries: uniqueUsersWithQueries.size,
        topTickers,
      },
    });
  } catch (error) {
    console.error('usage-summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load usage summary' },
      { status: 500 }
    );
  }
}

