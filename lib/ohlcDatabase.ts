/**
 * OHLC Data from Database
 * 
 * Fetches historical OHLC data from Supabase instead of external APIs.
 * This provides:
 * - Instant data retrieval (no API calls)
 * - Consistent data quality
 * - Offline capability
 * - No rate limiting
 */

import { supabase } from './supabase';
import type { OHLCDataRow } from './datasaham';

/**
 * Fetch historical OHLC data for multiple symbols from database
 * This is the primary function for screening
 */
export async function fetchOHLCFromDatabase(
  symbols: string[],
  daysBack: number = 252
): Promise<Map<string, OHLCDataRow[]>> {
  const map = new Map<string, OHLCDataRow[]>();
  
  if (symbols.length === 0) {
    return map;
  }

  console.log(`[Database] Fetching OHLC data for ${symbols.length} symbols (${daysBack} trading days)`);
  console.log(`[Database] 🚨 NEW CODE ACTIVE - Using .limit(200000) to get all rows!`);

  // Clean symbols (remove .JK suffix)
  const cleanSymbols = symbols.map(s => s.replace('.JK', '').toUpperCase());
  
  // Debug: show first few symbols being queried
  console.log(`[Database] Querying for symbols: ${cleanSymbols.slice(0, 5).join(', ')}...`);

  // Calculate date range (request more calendar days to ensure enough trading days)
  const endDate = new Date();
  const startDate = new Date();
  const calendarDaysNeeded = Math.ceil(daysBack * 1.45); // 45% buffer for weekends/holidays
  startDate.setDate(startDate.getDate() - calendarDaysNeeded);

  try {
    // Fetch data from database
    // Supabase has a 1000 row limit by default, need to paginate
    console.log(`[Database] Fetching all data with pagination...`);
    
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000; // Supabase's max per request
    let hasMore = true;
    
    while (hasMore) {
      const { data: pageData, error } = await supabase
        .from('ohlc_historical_data')
        .select('symbol, date, open, high, low, close, volume')
        .order('symbol')
        .order('date', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[Database] Error fetching OHLC data:', error.message);
        return map;
      }

      if (!pageData || pageData.length === 0) {
        break;
      }

      allData = allData.concat(pageData);
      console.log(`[Database] Fetched page ${Math.floor(from / pageSize) + 1}: ${pageData.length} rows (total: ${allData.length})`);
      
      // Check if we got less than page size, meaning we're done
      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }
    
    const data = allData;
    
    if (!data || data.length === 0) {
      console.warn('[Database] No OHLC data found in database for queried symbols');
      return map;
    }
    
    console.log(`[Database] Query complete: ${data.length} total rows from database`);

    // Group by symbol
    const grouped = new Map<string, OHLCDataRow[]>();
    
    // Filter for only the symbols we want (client-side filtering)
    const cleanSymbolsSet = new Set(cleanSymbols);
    
    data.forEach(row => {
      // Only include rows for symbols we're interested in
      if (!cleanSymbolsSet.has(row.symbol.toUpperCase())) {
        return;
      }
      
      if (!grouped.has(row.symbol)) {
        grouped.set(row.symbol, []);
      }
      grouped.get(row.symbol)!.push({
        date: row.date,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: row.volume ? Number(row.volume) : undefined
      });
    });
    
    // Debug: show what symbols were actually found
    console.log(`[Database] Symbols found after filtering: ${Array.from(grouped.keys()).slice(0, 10).join(', ')}${grouped.size > 10 ? '...' : ''}`);

    // Populate map with cleaned data
    for (const [symbol, rows] of grouped.entries()) {
      // Keep last N days
      const trimmed = rows.slice(-daysBack);
      map.set(symbol, trimmed);
      
      if (trimmed.length < daysBack) {
        console.warn(`[Database] ${symbol}: Only ${trimmed.length}/${daysBack} days available`);
      }
    }

    console.log(`[Database] Fetched ${map.size}/${symbols.length} symbols successfully`);
    
    // Log any missing symbols
    const missing = cleanSymbols.filter(s => !map.has(s));
    if (missing.length > 0) {
      console.warn(`[Database] Missing data for: ${missing.join(', ')}`);
    }

    return map;

  } catch (error) {
    console.error('[Database] Fetch error:', error);
    return map;
  }
}

/**
 * Fetch OHLC data for a single symbol
 */
export async function fetchOHLCForSymbol(
  symbol: string,
  daysBack: number = 252
): Promise<OHLCDataRow[]> {
  const cleanSymbol = symbol.replace('.JK', '').toUpperCase();
  
  const calendarDaysNeeded = Math.ceil(daysBack * 1.45);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - calendarDaysNeeded);

  try {
    const { data, error } = await supabase
      .from('ohlc_historical_data')
      .select('date, open, high, low, close, volume')
      .eq('symbol', cleanSymbol)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error(`[Database] Error fetching ${cleanSymbol}:`, error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const rows: OHLCDataRow[] = data.map(row => ({
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: row.volume ? Number(row.volume) : undefined
    }));

    return rows.slice(-daysBack);

  } catch (error) {
    console.error(`[Database] Fetch error for ${cleanSymbol}:`, error);
    return [];
  }
}

/**
 * Check data freshness for symbols
 * Returns symbols that need updating (data older than 1 day)
 */
export async function checkDataFreshness(
  symbols: string[]
): Promise<{
  fresh: string[];
  stale: string[];
  missing: string[];
}> {
  const cleanSymbols = symbols.map(s => s.replace('.JK', '').toUpperCase());

  try {
    const { data, error } = await supabase
      .from('ohlc_data_stats')
      .select('symbol, latest_date, days_since_update, data_status')
      .in('symbol', cleanSymbols);

    if (error) {
      console.error('[Database] Error checking freshness:', error.message);
      return { fresh: [], stale: [], missing: cleanSymbols };
    }

    const fresh: string[] = [];
    const stale: string[] = [];
    const found = new Set<string>();

    data?.forEach(stat => {
      found.add(stat.symbol);
      if (stat.data_status === 'fresh') {
        fresh.push(stat.symbol);
      } else {
        stale.push(stat.symbol);
      }
    });

    const missing = cleanSymbols.filter(s => !found.has(s));

    return { fresh, stale, missing };

  } catch (error) {
    console.error('[Database] Freshness check error:', error);
    return { fresh: [], stale: [], missing: cleanSymbols };
  }
}

/**
 * Get database statistics
 */
export async function getOHLCDatabaseStats() {
  try {
    const { data, error } = await supabase
      .from('ohlc_data_stats')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('[Database] Error fetching stats:', error.message);
      return null;
    }

    const totalSymbols = data?.length || 0;
    const freshSymbols = data?.filter(s => s.data_status === 'fresh').length || 0;
    const staleSymbols = data?.filter(s => s.data_status !== 'fresh').length || 0;

    return {
      totalSymbols,
      freshSymbols,
      staleSymbols,
      symbols: data
    };

  } catch (error) {
    console.error('[Database] Stats error:', error);
    return null;
  }
}
