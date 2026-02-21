/**
 * Yahoo Finance data fetcher for screener (no auth required)
 * Indonesian stocks use .JK suffix (e.g. BBCA.JK)
 */

import YahooFinance from 'yahoo-finance2';
import type { OHLCData } from './technical';

const IDX_SUFFIX = '.JK';
const yahooFinance = new YahooFinance();

export async function fetchYahooHistorical(
  emiten: string,
  daysBack: number = 120
): Promise<OHLCData[]> {
  const symbol = emiten.includes('.') ? emiten : `${emiten}${IDX_SUFFIX}`;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  try {
    const result = await yahooFinance.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
    });

    const quotes = result?.quotes;
    if (!quotes || quotes.length === 0) return [];

    return quotes
      .filter((q) => q.open != null && q.high != null && q.low != null && q.close != null)
      .map((q) => ({
        date: q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date),
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? undefined,
      }));
  } catch {
    return [];
  }
}
