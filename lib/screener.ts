/**
 * Stock Screener - Filter stocks by technical/fundamental criteria
 * Inspired by Pulse-CLI screen presets
 */

import { fetchHistoricalSummary } from './stockbit';
import { analyzeTechnical, type OHLCData, type TechnicalAnalysisResult } from './technical';
import type { HistoricalSummaryItem } from './stockbit';

export type ScreenerPreset =
  | 'oversold'
  | 'overbought'
  | 'bullish'
  | 'bearish'
  | 'breakout'
  | 'momentum'
  | 'undervalued';

export interface ScreenerCriteria {
  rsiMin?: number;
  rsiMax?: number;
  macdBullish?: boolean;
  priceAboveSma20?: boolean;
  priceBelowSma20?: boolean;
  signal?: 'buy' | 'sell' | 'neutral';
}

export interface ScreenedStock {
  emiten: string;
  price: number;
  rsi: number | null;
  macdSignal: string;
  trend: string;
  signal: string;
  score: number;
}

const PRESET_CRITERIA: Record<ScreenerPreset, (ta: TechnicalAnalysisResult) => boolean> = {
  oversold: (ta) => ta.rsi !== null && ta.rsi < 30,
  overbought: (ta) => ta.rsi !== null && ta.rsi > 70,
  bullish: (ta) =>
    ta.macdSignal === 'bullish' &&
    (ta.sma20 !== null && ta.sma20 !== undefined) &&
    ta.trend === 'bullish',
  bearish: (ta) =>
    ta.macdSignal === 'bearish' &&
    (ta.sma20 !== null && ta.sma20 !== undefined) &&
    ta.trend === 'bearish',
  breakout: (ta) =>
    ta.priceVsBB === 'above' && ta.trend === 'bullish' && (ta.rsi ?? 50) < 75,
  momentum: (ta) =>
    (ta.rsi ?? 0) >= 50 &&
    (ta.rsi ?? 0) <= 70 &&
    ta.macdSignal === 'bullish' &&
    ta.trend === 'bullish',
  undervalued: (ta) => ta.rsiSignal === 'oversold' || (ta.rsi ?? 50) < 35,
};

function toOHLC(item: HistoricalSummaryItem): OHLCData {
  return {
    date: item.date,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
  };
}

export async function screenStock(
  emiten: string,
  preset: ScreenerPreset
): Promise<ScreenedStock | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 120);

  try {
    const raw = await fetchHistoricalSummary(
      emiten,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      100
    );

    if (!raw || raw.length < 50) return null;

    const data = raw.map(toOHLC).reverse();
    const ta = analyzeTechnical(data);

    if (!PRESET_CRITERIA[preset](ta)) return null;

    const lastClose = data[data.length - 1]?.close ?? 0;
    let score = 50;
    if (ta.signal === 'buy') score += 20;
    if (ta.trend === 'bullish') score += 10;
    if (ta.rsiSignal === 'oversold' && preset === 'oversold') score += 15;

    return {
      emiten,
      price: lastClose,
      rsi: ta.rsi,
      macdSignal: ta.macdSignal,
      trend: ta.trend,
      signal: ta.signal,
      score,
    };
  } catch {
    return null;
  }
}

export async function runScreener(
  tickers: string[],
  preset: ScreenerPreset,
  onProgress?: (done: number, total: number) => void
): Promise<ScreenedStock[]> {
  const results: ScreenedStock[] = [];
  const total = tickers.length;

  for (let i = 0; i < tickers.length; i++) {
    onProgress?.(i + 1, total);
    const r = await screenStock(tickers[i], preset);
    if (r) results.push(r);

    if (i < tickers.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
