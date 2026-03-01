/**
 * Yahoo Finance data fetcher for screener (no auth required)
 * Indonesian stocks use .JK suffix (e.g. BBCA.JK)
 */

import YahooFinance from 'yahoo-finance2';
import type { OHLCData } from './technical';

const IDX_SUFFIX = '.JK';
const FETCH_TIMEOUT_MS = 20_000;

// Suppress deprecation notices for historical() API
const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), ms)
    ),
  ]);
}

export async function fetchYahooHistorical(
  emiten: string,
  daysBack: number = 120
): Promise<OHLCData[]> {
  const symbol = emiten.includes('.') ? emiten : `${emiten}${IDX_SUFFIX}`;

  const endDate = new Date();
  const startDate = new Date();
  
  // Yahoo Finance returns trading days only, but we specify calendar days
  // To get ~252 trading days, we need ~365 calendar days (accounting for weekends + holidays)
  // Add 50% buffer to ensure we get enough data
  const calendarDaysNeeded = Math.ceil(daysBack * 1.5);
  startDate.setDate(startDate.getDate() - calendarDaysNeeded);
  
  const period1 = startDate.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];

  try {
    // Use chart API directly (historical is deprecated)
    const result = await withTimeout(
      yahooFinance.chart(symbol, { period1, period2, interval: '1d' }),
      FETCH_TIMEOUT_MS
    );

    const quotes = result?.quotes;
    if (!quotes || quotes.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Yahoo] ${symbol}: No data found, symbol may be delisted`);
      }
      return [];
    }

    const ohlcData = quotes
      .filter(
        (q) =>
          q.open != null && q.high != null && q.low != null && q.close != null
      )
      .map((q) => ({
        date:
          q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date),
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? undefined,
      }));
    
    console.log(`[Yahoo] ${symbol}: Received ${ohlcData.length} days of data (requested ${daysBack})`);
    
    return ohlcData;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Yahoo] ${symbol}:`, err instanceof Error ? err.message : err);
    }
    return [];
  }
}
