/**
 * Minervini Stock Screening - 8 Criteria Implementation
 * Based on Mark Minervini's trend template for Stage 2 uptrends
 */

import { analyzeTechnical, calculateSMA, type OHLCData } from './technical';
import type { OHLCDataRow } from './datasaham';

export interface MinerviniCriteria {
  c1_priceAboveMA150_200: boolean;
  c2_ma150AboveMA200: boolean;
  c3_ma200TrendingUp: boolean;
  c4_ma50AboveMAs: boolean;
  c5_priceAboveMA50: boolean;
  c6_priceAbove30PercentLow: boolean;
  c7_priceWithin25PercentHigh: boolean;
  c8_relativeStrengthAbove70: boolean;
}

export type StageType = 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Stage 4' | 'Transition';

export interface StageAnalysis {
  stage: StageType;
  confidence: number; // 0-100
  description: string;
  signals: string[];
}

export interface MinerviniResult {
  emiten: string;
  sector: string;
  price: number;
  criteria: MinerviniCriteria;
  score: number; // 0-8
  rs: number; // Relative strength
  week52High: number;
  week52Low: number;
  ma50: number | null;
  ma150: number | null;
  ma200: number | null;
  stage?: StageAnalysis;
}

/**
 * Calculate 52-week high/low from OHLC data
 * @param data OHLC data array (should have at least 252 trading days)
 * @returns Object with high and low values
 */
export function calculate52WeekRange(data: OHLCData[]): { high: number; low: number } {
  const year = data.slice(-252); // ~252 trading days = 1 year
  if (year.length === 0) {
    return { high: 0, low: 0 };
  }
  const highs = year.map((d) => d.high);
  const lows = year.map((d) => d.low);
  return {
    high: Math.max(...highs),
    low: Math.min(...lows),
  };
}

/**
 * Check if MA200 is trending up (compare current vs 1 month ago)
 * @param closes Array of closing prices
 * @returns true if MA200 is trending upward
 */
export function isMA200TrendingUp(closes: number[]): boolean {
  if (closes.length < 220) return false; // Need 200 + 20 days

  const ma200Current = calculateSMA(closes, 200);
  const ma200OneMonthAgo = calculateSMA(closes.slice(0, -20), 200); // ~20 trading days = 1 month

  if (!ma200Current || !ma200OneMonthAgo) return false;
  return ma200Current > ma200OneMonthAgo;
}

/**
 * Calculate Relative Strength vs sector (percentile ranking)
 * @param stockReturns Annual return of the stock
 * @param sectorReturns Array of annual returns for all stocks in the sector
 * @returns RS score 0-100 (higher = stronger relative performance)
 */
export function calculateSectorRS(
  stockReturns: number,
  sectorReturns: number[]
): number {
  if (sectorReturns.length === 0) return 50; // Default to neutral if no sector data

  const sorted = [...sectorReturns].sort((a, b) => a - b);
  const rank = sorted.filter((r) => r < stockReturns).length;
  return (rank / sorted.length) * 100;
}

/**
 * Calculate annual return from OHLC data
 * @param data OHLC data array
 * @returns Percentage return over the period
 */
export function calculateYearReturn(data: OHLCDataRow[]): number {
  if (data.length < 2) return 0;
  const oldPrice = data[0].close;
  const newPrice = data[data.length - 1].close;
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Analyze stock stage based on Mark Minervini's Stage Analysis
 * Stage 1: Consolidation/Base Building (accumulation)
 * Stage 2: Advancing/Uptrend (markup)
 * Stage 3: Top/Distribution
 * Stage 4: Declining/Downtrend (markdown)
 * @param data OHLC data
 * @param ta Technical analysis result
 * @returns StageAnalysis
 */
export function analyzeStage(data: OHLCData[], ta: ReturnType<typeof analyzeTechnical>): StageAnalysis {
  const closes = data.map((d) => d.close);
  const lastClose = closes[closes.length - 1];
  
  if (!lastClose || !ta.sma50 || !ta.sma150 || !ta.sma200) {
    return {
      stage: 'Transition',
      confidence: 0,
      description: 'Insufficient data for stage analysis',
      signals: []
    };
  }

  const { high: week52High, low: week52Low } = calculate52WeekRange(data);
  const priceVs52WeekRange = ((lastClose - week52Low) / (week52High - week52Low)) * 100;
  
  const signals: string[] = [];
  let stageScore = {
    stage1: 0,
    stage2: 0,
    stage3: 0,
    stage4: 0
  };

  // Check MA alignment and trend
  const maAlignment = ta.sma50 > ta.sma150 && ta.sma150 > ta.sma200;
  const maAlignmentReversed = ta.sma50 < ta.sma150 && ta.sma150 < ta.sma200;
  const ma200TrendingUp = isMA200TrendingUp(closes);
  const ma200TrendingDown = !ma200TrendingUp && closes.length >= 220;

  // Price position relative to MAs
  const priceAboveAllMAs = lastClose > ta.sma50 && lastClose > ta.sma150 && lastClose > ta.sma200;
  const priceBelowAllMAs = lastClose < ta.sma50 && lastClose < ta.sma150 && lastClose < ta.sma200;

  // Stage 2: Advancing (ideal uptrend)
  if (maAlignment) {
    stageScore.stage2 += 30;
    signals.push('Bullish MA alignment (50>150>200)');
  }
  if (priceAboveAllMAs) {
    stageScore.stage2 += 25;
    signals.push('Price above all major MAs');
  }
  if (ma200TrendingUp) {
    stageScore.stage2 += 20;
    signals.push('MA200 trending up');
  }
  if (priceVs52WeekRange >= 75) {
    stageScore.stage2 += 25;
    signals.push(`Price near 52W high (${priceVs52WeekRange.toFixed(0)}%)`);
  }

  // Stage 4: Declining (downtrend)
  if (maAlignmentReversed) {
    stageScore.stage4 += 30;
    signals.push('Bearish MA alignment (50<150<200)');
  }
  if (priceBelowAllMAs) {
    stageScore.stage4 += 25;
    signals.push('Price below all major MAs');
  }
  if (ma200TrendingDown) {
    stageScore.stage4 += 20;
    signals.push('MA200 trending down');
  }
  if (priceVs52WeekRange <= 25) {
    stageScore.stage4 += 25;
    signals.push(`Price near 52W low (${priceVs52WeekRange.toFixed(0)}%)`);
  }

  // Stage 1: Consolidation/Base Building (after Stage 4)
  if (priceBelowAllMAs && !maAlignmentReversed) {
    stageScore.stage1 += 20;
    signals.push('Potential base building');
  }
  if (!ma200TrendingUp && !ma200TrendingDown) {
    stageScore.stage1 += 20;
    signals.push('MA200 flattening');
  }
  if (priceVs52WeekRange >= 25 && priceVs52WeekRange <= 50) {
    stageScore.stage1 += 20;
    signals.push('Price in middle range (consolidation zone)');
  }
  if (lastClose <= ta.sma200 && lastClose >= ta.sma200 * 0.95) {
    stageScore.stage1 += 20;
    signals.push('Price near MA200 support');
  }

  // Stage 3: Topping/Distribution
  if (priceAboveAllMAs && !maAlignment) {
    stageScore.stage3 += 25;
    signals.push('Price high but MAs not aligned');
  }
  if (priceVs52WeekRange >= 75 && !ma200TrendingUp) {
    stageScore.stage3 += 25;
    signals.push('Near highs but MA200 not rising');
  }
  if (lastClose < ta.sma50 && lastClose > ta.sma150) {
    stageScore.stage3 += 25;
    signals.push('Price broke below MA50 (potential distribution)');
  }
  if (maAlignment && lastClose < ta.sma50) {
    stageScore.stage3 += 25;
    signals.push('Weakness despite bullish setup');
  }

  // Determine dominant stage
  const maxScore = Math.max(stageScore.stage1, stageScore.stage2, stageScore.stage3, stageScore.stage4);
  let stage: StageType;
  let confidence = maxScore;
  let description = '';

  if (maxScore < 30) {
    stage = 'Transition';
    description = 'Stock is in transition between stages';
  } else if (stageScore.stage2 === maxScore) {
    stage = 'Stage 2';
    description = 'Advancing uptrend - ideal for buying';
  } else if (stageScore.stage4 === maxScore) {
    stage = 'Stage 4';
    description = 'Declining downtrend - avoid or sell';
  } else if (stageScore.stage1 === maxScore) {
    stage = 'Stage 1';
    description = 'Base building - watch for breakout';
  } else {
    stage = 'Stage 3';
    description = 'Topping/distribution - consider taking profits';
  }

  return {
    stage,
    confidence,
    description,
    signals: signals.slice(0, 5)
  };
}

/**
 * Main Minervini screening function - checks all 8 criteria
 * @param data OHLC data (needs at least 252 trading days)
 * @param sectorRS Relative strength vs sector
 * @returns MinerviniResult or null if insufficient data
 */
export function checkMinerviniCriteria(
  data: OHLCData[],
  sectorRS: number
): MinerviniResult | null {
  if (data.length < 252) return null; // Need 1 year of data

  const ta = analyzeTechnical(data);
  const closes = data.map((d) => d.close);
  const lastClose = closes[closes.length - 1];

  if (!lastClose) return null;

  const { high: week52High, low: week52Low } = calculate52WeekRange(data);

  // Perform stage analysis
  const stageAnalysis = analyzeStage(data, ta);

  // Check all 8 Minervini criteria
  const criteria: MinerviniCriteria = {
    // C1: Price above MA150 and MA200
    c1_priceAboveMA150_200: !!(
      ta.sma150 &&
      ta.sma200 &&
      lastClose > ta.sma150 &&
      lastClose > ta.sma200
    ),

    // C2: MA150 above MA200
    c2_ma150AboveMA200: !!(ta.sma150 && ta.sma200 && ta.sma150 > ta.sma200),

    // C3: MA200 trending up (vs 1 month ago)
    c3_ma200TrendingUp: isMA200TrendingUp(closes),

    // C4: MA50 above MA150 and MA200
    c4_ma50AboveMAs: !!(
      ta.sma50 &&
      ta.sma150 &&
      ta.sma200 &&
      ta.sma50 > ta.sma150 &&
      ta.sma50 > ta.sma200
    ),

    // C5: Price above MA50
    c5_priceAboveMA50: !!(ta.sma50 && lastClose > ta.sma50),

    // C6: Price at least 30% above 52-week low
    c6_priceAbove30PercentLow: week52Low > 0 && lastClose > week52Low * 1.3,

    // C7: Price within 25% of 52-week high (at least 75% of high)
    c7_priceWithin25PercentHigh: week52High > 0 && lastClose >= week52High * 0.75,

    // C8: Relative Strength above 70 (vs sector)
    c8_relativeStrengthAbove70: sectorRS > 70,
  };

  // Count how many criteria are met
  const score = Object.values(criteria).filter(Boolean).length;

  return {
    emiten: '',
    sector: '',
    price: lastClose,
    criteria,
    score,
    rs: sectorRS,
    week52High,
    week52Low,
    ma50: ta.sma50,
    ma150: ta.sma150,
    ma200: ta.sma200,
    stage: stageAnalysis,
  };
}

/**
 * Helper to build sector map from stock info
 * @param sectorData Map of stock ticker to sector name
 * @returns Map organized for quick lookup
 */
export function buildSectorMap(sectorData: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [ticker, sector] of Object.entries(sectorData)) {
    map.set(ticker.toUpperCase(), sector);
  }
  return map;
}

/**
 * Calculate sector returns map for RS calculation
 * @param ohlcMap Map of ticker to OHLC data
 * @param sectorMap Map of ticker to sector
 * @returns Map of sector to array of returns
 */
export function calculateSectorReturnsMap(
  ohlcMap: Map<string, OHLCDataRow[]>,
  sectorMap: Map<string, string>
): Map<string, number[]> {
  const sectorReturns = new Map<string, number[]>();

  for (const [ticker, data] of ohlcMap.entries()) {
    const sector = sectorMap.get(ticker) || 'Unknown';
    const returns = calculateYearReturn(data);

    if (!sectorReturns.has(sector)) {
      sectorReturns.set(sector, []);
    }
    sectorReturns.get(sector)!.push(returns);
  }

  return sectorReturns;
}
