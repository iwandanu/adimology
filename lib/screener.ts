/**
 * Stock Screener - Filter stocks by technical/fundamental criteria
 * Data sources: OHLC.dev (when configured) or Yahoo Finance
 */

import { fetchYahooHistorical } from './yahooFinance';
import { analyzeTechnical, type OHLCData, type TechnicalAnalysisResult } from './technical';
import type { OHLCDataRow } from './datasaham';

export type ScreenerPreset =
  | 'oversold'
  | 'overbought'
  | 'bullish'
  | 'bearish'
  | 'breakout'
  | 'momentum'
  | 'undervalued'
  | 'rsi_extreme';

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
    ta.sma20 != null &&
    ta.trend === 'bullish',
  bearish: (ta) =>
    ta.macdSignal === 'bearish' &&
    ta.sma20 != null &&
    ta.trend === 'bearish',
  breakout: (ta) =>
    ta.priceVsBB === 'above' && ta.trend === 'bullish' && (ta.rsi ?? 50) < 80,
  momentum: (ta) =>
    (ta.rsi ?? 0) >= 45 &&
    (ta.rsi ?? 0) <= 75 &&
    ta.macdSignal === 'bullish' &&
    (ta.trend === 'bullish' || ta.trend === 'sideways'),
  undervalued: (ta) => ta.rsiSignal === 'oversold' || (ta.rsi ?? 99) < 40,
  rsi_extreme: (ta) =>
    (ta.rsi !== null && ta.rsi < 30) || (ta.rsi !== null && ta.rsi > 70),
};

export async function screenStock(
  emiten: string,
  preset: ScreenerPreset,
  ohlcMap?: Map<string, OHLCDataRow[]>
): Promise<ScreenedStock | null> {
  try {
    let data: OHLCData[];

    if (ohlcMap) {
      const rows = ohlcMap.get(emiten.toUpperCase());
      if (!rows || rows.length < 35) return null;
      data = rows.map((r) => ({
        date: r.date,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
      }));
    } else {
      const yahoo = await fetchYahooHistorical(emiten, 120);
      if (!yahoo || yahoo.length < 35) return null;
      data = yahoo;
    }

    // Data is chronological (oldest first) - technical analysis expects this
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
  onProgress?: (done: number, total: number) => void,
  ohlcMap?: Map<string, OHLCDataRow[]>
): Promise<ScreenedStock[]> {
  const results: ScreenedStock[] = [];
  const total = tickers.length;

  for (let i = 0; i < tickers.length; i++) {
    onProgress?.(i + 1, total);
    const r = await screenStock(tickers[i], preset, ohlcMap);
    if (r) results.push(r);

    if (!ohlcMap && i < tickers.length - 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
