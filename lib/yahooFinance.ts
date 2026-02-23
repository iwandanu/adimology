/**
 * Yahoo Finance data fetcher for screener (no auth required)
 * Indonesian stocks use .JK suffix (e.g. BBCA.JK)
 */

import YahooFinance from 'yahoo-finance2';
import type { OHLCData } from './technical';

const IDX_SUFFIX = '.JK';
const FETCH_TIMEOUT_MS = 20_000;
const yahooFinance = new YahooFinance();

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
  startDate.setDate(startDate.getDate() - daysBack);
  const period1 = startDate.toISOString().split('T')[0];
  const period2 = endDate.toISOString().split('T')[0];

  try {
    // Try historical API first (simpler, often more reliable for international stocks)
    const history = await withTimeout(
      yahooFinance.historical(symbol, { period1, period2, interval: '1d' }),
      FETCH_TIMEOUT_MS
    );

    if (Array.isArray(history) && history.length > 0) {
      return history
        .filter(
          (row) =>
            row.open != null &&
            row.high != null &&
            row.low != null &&
            row.close != null
        )
        .map((row) => ({
          date:
            row.date instanceof Date
              ? row.date.toISOString().split('T')[0]
              : String(row.date),
          open: row.open ?? 0,
          high: row.high ?? 0,
          low: row.low ?? 0,
          close: row.close ?? 0,
          volume: row.volume ?? undefined,
        }));
    }

    // Fallback to chart API
    const result = await withTimeout(
      yahooFinance.chart(symbol, { period1, period2, interval: '1d' }),
      FETCH_TIMEOUT_MS
    );

    const quotes = result?.quotes;
    if (!quotes || quotes.length === 0) return [];

    return quotes
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
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Yahoo] ${symbol}:`, err instanceof Error ? err.message : err);
    }
    return [];
  }
}
