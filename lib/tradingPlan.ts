/**
 * Trading Plan Generator - TP/SL/Risk-Reward with position sizing
 * Inspired by Pulse-CLI trading plan feature
 */

import { getFraksi } from './calculations';
import type { OHLCData } from './technical';
import { calculateATR } from './technical';

export interface TradingPlanInput {
  emiten: string;
  currentPrice: number;
  targetRealistis: number;
  targetMax: number;
  atr?: number;
  historicalData?: OHLCData[];
  accountSize?: number;
  riskPercent?: number;
}

export interface TakeProfitLevel {
  price: number;
  percentGain: number;
  label: string;
}

export interface TradingPlanResult {
  emiten: string;
  entry: {
    price: number;
    type: 'market' | 'limit';
    trend: string;
    signal: string;
  };
  takeProfit: TakeProfitLevel[];
  stopLoss: {
    price: number;
    percentLoss: number;
    method: string;
  };
  riskReward: {
    riskPerShare: number;
    rewardTP1: number;
    rewardTP2: number;
    rrToTP1: number;
    rrToTP2: number;
    quality: 'good' | 'fair' | 'poor';
  };
  positionSizing?: {
    accountSize: number;
    maxRiskAmount: number;
    suggestedLots: number;
    suggestedShares: number;
    positionValue: number;
    percentOfAccount: number;
  };
  executionStrategy: string[];
}

/** Calculate stop loss - use ATR-based or percentage, whichever is tighter */
function calculateStopLoss(
  currentPrice: number,
  atr: number | null,
  fraksi: number,
  riskPercent: number = 3
): { price: number; method: string } {
  const pctBased = currentPrice * (1 - riskPercent / 100);
  let atrBased = currentPrice;

  if (atr && atr > 0) {
    atrBased = currentPrice - 2 * atr;
  }

  const slPrice = Math.max(pctBased, atrBased);
  const rounded = Math.floor(slPrice / fraksi) * fraksi;
  const method = atr && atr > 0 ? 'ATR-based (2x)' : 'Percentage-based';

  return {
    price: Math.max(rounded, fraksi),
    method,
  };
}

/** Round price to fraksi */
function roundToFraksi(price: number, fraksi: number): number {
  return Math.round(price / fraksi) * fraksi;
}

export function generateTradingPlan(input: TradingPlanInput): TradingPlanResult {
  const {
    emiten,
    currentPrice,
    targetRealistis,
    targetMax,
    accountSize = 100_000_000,
    riskPercent = 2,
  } = input;

  const fraksi = getFraksi(currentPrice);

  let atr: number | null = null;
  if (input.atr) {
    atr = input.atr;
  } else if (input.historicalData && input.historicalData.length >= 15) {
    atr = calculateATR(input.historicalData, 14);
  }

  const stopLoss = calculateStopLoss(
    currentPrice,
    atr,
    fraksi,
    Math.min(5, (targetRealistis - currentPrice) / currentPrice * 100)
  );

  const tp1 = roundToFraksi(targetRealistis, fraksi);
  const tp2 = roundToFraksi(targetMax, fraksi);
  const tp3 = roundToFraksi(currentPrice + (targetMax - currentPrice) * 1.5, fraksi);

  const takeProfit: TakeProfitLevel[] = [
    { price: tp1, percentGain: ((tp1 - currentPrice) / currentPrice) * 100, label: 'TP1 (Conservative)' },
    { price: tp2, percentGain: ((tp2 - currentPrice) / currentPrice) * 100, label: 'TP2 (Moderate)' },
    { price: tp3, percentGain: ((tp3 - currentPrice) / currentPrice) * 100, label: 'TP3 (Aggressive)' },
  ];

  const riskPerShare = currentPrice - stopLoss.price;
  const rewardTP1 = tp1 - currentPrice;
  const rewardTP2 = tp2 - currentPrice;

  const rrToTP1 = riskPerShare > 0 ? rewardTP1 / riskPerShare : 0;
  const rrToTP2 = riskPerShare > 0 ? rewardTP2 / riskPerShare : 0;

  let quality: 'good' | 'fair' | 'poor' = 'fair';
  if (rrToTP1 >= 1.5 && rrToTP2 >= 2) quality = 'good';
  else if (rrToTP1 < 0.5 || rrToTP2 < 1) quality = 'poor';

  let positionSizing: TradingPlanResult['positionSizing'];

  if (accountSize > 0 && riskPerShare > 0) {
    const maxRiskAmount = accountSize * (riskPercent / 100);
    const sharesPerLot = 100;
    const maxShares = Math.floor(maxRiskAmount / riskPerShare);
    const suggestedLots = Math.floor(maxShares / sharesPerLot) || 1;
    const suggestedShares = suggestedLots * sharesPerLot;
    const positionValue = suggestedShares * currentPrice;

    positionSizing = {
      accountSize,
      maxRiskAmount,
      suggestedLots,
      suggestedShares,
      positionValue,
      percentOfAccount: (positionValue / accountSize) * 100,
    };
  }

  const executionStrategy = [
    `1. Entry: Buy at market or limit Rp ${currentPrice.toLocaleString('id-ID')}`,
    `2. Set stop loss immediately at Rp ${stopLoss.price.toLocaleString('id-ID')}`,
    `3. TP1: Sell 50% position at Rp ${tp1.toLocaleString('id-ID')}`,
    '4. After TP1 hit: Move SL to breakeven',
    `5. TP2: Sell remaining 50% at Rp ${tp2.toLocaleString('id-ID')}`,
  ];

  return {
    emiten,
    entry: {
      price: currentPrice,
      type: 'market',
      trend: 'Bullish',
      signal: 'Buy',
    },
    takeProfit,
    stopLoss: {
      price: stopLoss.price,
      percentLoss: ((currentPrice - stopLoss.price) / currentPrice) * 100,
      method: stopLoss.method,
    },
    riskReward: {
      riskPerShare,
      rewardTP1,
      rewardTP2,
      rrToTP1,
      rrToTP2,
      quality,
    },
    positionSizing,
    executionStrategy,
  };
}
