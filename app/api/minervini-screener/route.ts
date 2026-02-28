import { NextRequest } from 'next/server';
import { fetchDatasahamHistoricalMap, buildSectorMapFromDatasaham } from '@/lib/datasaham';
import {
  checkMinerviniCriteria,
  calculateSectorRS,
  calculateSectorReturnsMap,
  calculateYearReturn,
  type MinerviniResult,
} from '@/lib/minervini';
import { UNIVERSES } from '@/lib/universes';
import type { OHLCDataRow } from '@/lib/datasaham';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Minervini Screener API
 * Scans stocks based on Mark Minervini's 8 criteria
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const universe = searchParams.get('universe') || 'lq45';
  const minScore = parseInt(searchParams.get('minScore') || '6', 10);

  try {
    const tickers = UNIVERSES[universe] || UNIVERSES.lq45;

    console.log(`[Minervini] Screening ${tickers.length} stocks from ${universe} universe`);

    // Fetch 252 days of data for all stocks (bulk)
    const ohlcMap = await fetchDatasahamHistoricalMap(tickers, 252);

    console.log(`[Minervini] Fetched OHLC data for ${ohlcMap.size} stocks`);

    // Build sector map using DataSaham API
    const sectorMap = await buildSectorMapFromDatasaham(tickers);

    console.log(`[Minervini] Built sector map with ${sectorMap.size} entries from DataSaham API`);

    // Calculate sector returns for RS calculation
    const sectorReturns = calculateSectorReturnsMap(ohlcMap, sectorMap);

    console.log(`[Minervini] Calculated sector returns for ${sectorReturns.size} sectors`);

    const results: MinerviniResult[] = [];

    // Screen each stock
    for (const ticker of tickers) {
      const data = ohlcMap.get(ticker);
      if (!data || data.length < 252) {
        console.log(`[Minervini] Skipping ${ticker} - insufficient data (${data?.length || 0} days)`);
        continue;
      }

      const sector = sectorMap.get(ticker) || 'Unknown';
      const stockReturn = calculateYearReturn(data);
      const sectorRS = calculateSectorRS(stockReturn, sectorReturns.get(sector) || []);

      const result = checkMinerviniCriteria(data, sectorRS);

      if (result && result.score >= minScore) {
        result.emiten = ticker;
        result.sector = sector;
        results.push(result);
        console.log(`[Minervini] ${ticker} passed with score ${result.score}/8 (RS: ${sectorRS.toFixed(1)})`);
      }
    }

    // Sort by score (8/8 first) then by RS
    results.sort((a, b) => b.score - a.score || b.rs - a.rs);

    console.log(`[Minervini] Screening complete: ${results.length} stocks passed with score >= ${minScore}`);

    return Response.json({
      success: true,
      data: {
        results,
        count: results.length,
        scannedAt: new Date().toISOString(),
        universe,
        minScore,
      },
    });
  } catch (error) {
    console.error('[Minervini] Screening error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
