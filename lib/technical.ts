/**
 * Technical Analysis Module - RSI, MACD, Bollinger Bands, SMA
 * Based on OHLC data from Stockbit historical summary
 */

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** RSI calculation - period typically 14 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const closes = prices.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Simple Moving Average */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Exponential Moving Average */
export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

/** MACD - returns { macd, signal, histogram } */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < slowPeriod + signalPeriod) return null;

  const emaFast: number[] = [];
  const emaSlow: number[] = [];
  const fastMult = 2 / (fastPeriod + 1);
  const slowMult = 2 / (slowPeriod + 1);

  let emaF = prices.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  let emaS = prices.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

  for (let i = 0; i < slowPeriod; i++) {
    if (i >= fastPeriod - 1) {
      emaF = (prices[i] - emaF) * fastMult + emaF;
      emaFast.push(emaF);
    }
    emaS = (prices[i] - emaS) * slowMult + emaS;
    emaSlow.push(emaS);
  }

  for (let i = slowPeriod; i < prices.length; i++) {
    emaF = (prices[i] - emaF) * fastMult + emaF;
    emaS = (prices[i] - emaS) * slowMult + emaS;
    emaFast.push(emaF);
    emaSlow.push(emaS);
  }

  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  if (macdLine.length < signalPeriod) return null;

  const signalMult = 2 / (signalPeriod + 1);
  let signalLine = macdLine.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;

  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalLine = (macdLine[i] - signalLine) * signalMult + signalLine;
  }

  const lastMacd = macdLine[macdLine.length - 1];
  const histogram = lastMacd - signalLine;

  return {
    macd: lastMacd,
    signal: signalLine,
    histogram,
  };
}

/** Bollinger Bands - returns { upper, middle, lower, bandwidth } */
export function calculateBollinger(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number; bandwidth: number } | null {
  if (prices.length < period) return null;

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const sd = Math.sqrt(variance);
  const upper = middle + stdDev * sd;
  const lower = middle - stdDev * sd;
  const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

  return { upper, middle, lower, bandwidth };
}

/** ATR - Average True Range for volatility/stop loss */
export function calculateATR(data: OHLCData[], period: number = 14): number | null {
  if (data.length < period + 1) return null;

  const tr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const trVal = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trVal);
  }

  const atrSlice = tr.slice(-period);
  return atrSlice.reduce((a, b) => a + b, 0) / period;
}

/** Simple support/resistance from recent highs and lows */
export function findSupportResistance(data: OHLCData[], lookback: number = 20): {
  support: number;
  resistance: number;
} | null {
  if (data.length < lookback) return null;

  const slice = data.slice(-lookback);
  const lows = slice.map((d) => d.low);
  const highs = slice.map((d) => d.high);
  const support = Math.min(...lows);
  const resistance = Math.max(...highs);

  return { support, resistance };
}

/** Full technical analysis result */
export interface TechnicalAnalysisResult {
  rsi: number | null;
  rsiSignal: 'oversold' | 'overbought' | 'neutral';
  sma5: number | null;
  sma10: number | null;
  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma150: number | null;
  sma200: number | null;
  lastClose: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  bollinger: { upper: number; middle: number; lower: number; bandwidth: number } | null;
  priceVsBB: 'above' | 'below' | 'middle';
  atr: number | null;
  support: number | null;
  resistance: number | null;
  trend: 'bullish' | 'bearish' | 'sideways';
  signal: 'buy' | 'sell' | 'neutral';
}

export function analyzeTechnical(data: OHLCData[]): TechnicalAnalysisResult {
  const closes = data.map((d) => d.close);
  const result: TechnicalAnalysisResult = {
    rsi: null,
    rsiSignal: 'neutral',
    sma5: null,
    sma10: null,
    sma20: null,
    sma50: null,
    sma100: null,
    sma150: null,
    sma200: null,
    lastClose: null,
    macd: null,
    macdSignal: 'neutral',
    bollinger: null,
    priceVsBB: 'middle',
    atr: null,
    support: null,
    resistance: null,
    trend: 'sideways',
    signal: 'neutral',
  };

  result.rsi = calculateRSI(closes, 14);
  if (result.rsi !== null) {
    if (result.rsi < 30) result.rsiSignal = 'oversold';
    else if (result.rsi > 70) result.rsiSignal = 'overbought';
  }

  result.sma5 = calculateSMA(closes, 5);
  result.sma10 = calculateSMA(closes, 10);
  result.sma20 = calculateSMA(closes, 20);
  result.sma50 = calculateSMA(closes, 50);
  result.sma100 = calculateSMA(closes, 100);
  result.sma150 = calculateSMA(closes, 150);
  result.sma200 = calculateSMA(closes, 200);

  result.macd = calculateMACD(closes);
  if (result.macd) {
    result.macdSignal =
      result.macd.histogram > 0 ? 'bullish' : result.macd.histogram < 0 ? 'bearish' : 'neutral';
  }

  result.bollinger = calculateBollinger(closes, 20, 2);
  const lastClose = closes[closes.length - 1];
  result.lastClose = lastClose ?? null;
  if (result.bollinger && lastClose) {
    if (lastClose > result.bollinger.upper) result.priceVsBB = 'above';
    else if (lastClose < result.bollinger.lower) result.priceVsBB = 'below';
  }

  result.atr = calculateATR(data, 14);

  const sr = findSupportResistance(data, 20);
  if (sr) {
    result.support = sr.support;
    result.resistance = sr.resistance;
  }

  // Trend: price vs SMAs
  if (result.sma20 && result.sma50 && result.sma200 && lastClose) {
    if (lastClose > result.sma20 && result.sma20 > result.sma50) result.trend = 'bullish';
    else if (lastClose < result.sma20 && result.sma20 < result.sma50) result.trend = 'bearish';
  }

  // Aggregate signal
  let buySignals = 0;
  let sellSignals = 0;
  if (result.rsiSignal === 'oversold') buySignals++;
  else if (result.rsiSignal === 'overbought') sellSignals++;
  if (result.macdSignal === 'bullish') buySignals++;
  else if (result.macdSignal === 'bearish') sellSignals++;
  if (result.priceVsBB === 'below') buySignals++;
  else if (result.priceVsBB === 'above') sellSignals++;
  if (result.trend === 'bullish') buySignals++;
  else if (result.trend === 'bearish') sellSignals++;

  if (buySignals >= 3) result.signal = 'buy';
  else if (sellSignals >= 3) result.signal = 'sell';

  return result;
}
