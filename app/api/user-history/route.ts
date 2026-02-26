import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const emiten = searchParams.get('emiten') || undefined;
    const sector = searchParams.get('sector') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const sortBy = searchParams.get('sortBy') || 'from_date';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    if (!userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('stock_queries')
      .select('*', { count: 'exact' });

    // Filter by user ID if not admin
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }

    // Apply filters
    if (emiten) {
      const emitenList = emiten.split(/\s+/).filter(Boolean);
      if (emitenList.length > 0) {
        query = query.in('emiten', emitenList);
      }
    }
    if (sector && sector !== 'all') {
      query = query.eq('sector', sector);
    }
    if (fromDate) {
      query = query.gte('from_date', fromDate);
    }
    if (toDate) {
      query = query.lte('from_date', toDate);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Sorting
    if (sortBy === 'combined') {
      query = query
        .order('from_date', { ascending: sortOrder === 'asc' })
        .order('emiten', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'emiten') {
      query = query
        .order('emiten', { ascending: sortOrder === 'asc' })
        .order('from_date', { ascending: true });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Pagination
    if (limit && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching user history:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count,
    });

  } catch (error) {
    console.error('Error in user-history API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
