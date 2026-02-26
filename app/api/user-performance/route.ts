import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const validLimits = [3, 5, 10, 20, 50];
    const finalLimit = validLimits.includes(limit) ? limit : 5;

    // Fetch user's successful stock queries
    let query = supabase
      .from('stock_queries')
      .select('emiten, sector, target_realistis, target_max, max_harga, status, from_date, bandar')
      .eq('status', 'success')
      .order('from_date', { ascending: false });

    // Filter by user ID if not admin
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user performance:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Aggregate data per emiten
    const emitenGroups: Record<string, any[]> = {};
    (data || []).forEach(record => {
      if (!emitenGroups[record.emiten]) {
        emitenGroups[record.emiten] = [];
      }
      if (emitenGroups[record.emiten].length < finalLimit) {
        emitenGroups[record.emiten].push(record);
      }
    });

    // Calculate stats for each emiten
    const stats = Object.entries(emitenGroups).map(([emiten, records]) => {
      const tradingDays = records.length;
      let hitR1 = 0;
      let hitMax = 0;
      const sector = records[0]?.sector;

      const bandarCounts: Record<string, number> = {};
      
      records.forEach(r => {
        if (r.max_harga && r.target_realistis && r.max_harga >= r.target_realistis) {
          hitR1++;
        }
        if (r.max_harga && r.target_max && r.max_harga >= r.target_max) {
          hitMax++;
        }
        
        if (r.bandar) {
          bandarCounts[r.bandar] = (bandarCounts[r.bandar] || 0) + 1;
        }
      });

      const topBandars = Object.entries(bandarCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const hitRateR1 = (hitR1 / tradingDays) * 100;
      const hitRateMax = (hitMax / tradingDays) * 100;
      const totalHitRate = (hitRateR1 + hitRateMax) / 2;

      return {
        emiten,
        sector,
        tradingDays,
        hitR1,
        hitMax,
        hitRateR1,
        hitRateMax,
        totalHitRate,
        topBandars
      };
    });

    // Sort by totalHitRate descending
    const sortedStats = stats.sort((a, b) => b.totalHitRate - a.totalHitRate);

    return NextResponse.json({
      success: true,
      data: sortedStats,
      limit: finalLimit
    });

  } catch (error) {
    console.error('Error in user-performance API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
