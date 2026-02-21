/**
 * Bandarmology - Multi-day broker flow analysis
 * Analyzes broker accumulation/distribution patterns over multiple days
 * Inspired by Pulse-CLI bandarmology feature
 */

import { fetchMarketDetector, getBrokerSummary } from './stockbit';
import { BROKERS, type BrokerType } from './brokers';
import type { MarketDetectorResponse } from './types';

export interface DailyBrokerFlow {
  date: string;
  topBuyers: { code: string; bval: number; blot: number; type: BrokerType }[];
  topSellers: { code: string; sval: number; slot: number; type: BrokerType }[];
  detector: { top1: { accdist: string }; broker_accdist: string };
}

export interface BandarmologyResult {
  emiten: string;
  period: { from: string; to: string; days: number };
  flowMomentum: number;
  flowMomentumSignal: 'buy' | 'sell' | 'neutral';
  phase: 'early_accumulation' | 'mid_accumulation' | 'late_accumulation' | 'markup_ready' | 'distribution' | 'neutral';
  brokerComposition: Record<BrokerType, number>;
  patternAlerts: string[];
  recommendation: string;
  dailyFlows: DailyBrokerFlow[];
}

/** Get broker type from code */
function getBrokerType(code: string): BrokerType {
  return BROKERS[code?.toUpperCase()]?.type || 'Unknown';
}

/** Smart Money broker codes (Whale + Smartmoney) */
const SMART_MONEY_TYPES: BrokerType[] = ['Smartmoney', 'Whale'];
/** Bandar/Gorengan - Mix with high activity */
const BANDAR_CODES = ['SQ', 'MG', 'EP', 'DR', 'BZ'];
/** Retail */
const RETAIL_TYPES: BrokerType[] = ['Retail'];

export async function analyzeBandarmology(
  emiten: string,
  days: number = 10
): Promise<BandarmologyResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days * 2);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const dailyFlows: DailyBrokerFlow[] = [];
  const brokerNetByType: Record<BrokerType, number> = {
    Smartmoney: 0,
    Whale: 0,
    Retail: 0,
    Mix: 0,
    Unknown: 0,
  };

  let totalBrokerVolume = 0;
  const brokerVolumeByType: Record<BrokerType, number> = {
    Smartmoney: 0,
    Whale: 0,
    Retail: 0,
    Mix: 0,
    Unknown: 0,
  };

  const patternAlerts: string[] = [];
  let accumulationDays = 0;

  for (let d = 0; d < days; d++) {
    const dte = new Date();
    dte.setDate(dte.getDate() - d);
    const dateStr = dte.toISOString().split('T')[0];

    try {
      const data: MarketDetectorResponse = await fetchMarketDetector(emiten, dateStr, dateStr);
      const summary = getBrokerSummary(data);

      const buyers = (summary.topBuyers || []).map((b: any) => ({
        code: b.netbs_broker_code,
        bval: Number(b.bval || 0),
        blot: Number(b.blot || 0),
        type: getBrokerType(b.netbs_broker_code),
      }));

      const sellers = (summary.topSellers || []).map((s: any) => ({
        code: s.netbs_broker_code,
        sval: Number(s.sval || 0),
        slot: Number(s.slot || 0),
        type: getBrokerType(s.netbs_broker_code),
      }));

      const top1Acc = summary.detector?.top1?.accdist || '-';

      dailyFlows.push({
        date: dateStr,
        topBuyers: buyers,
        topSellers: sellers,
        detector: {
          top1: { accdist: top1Acc },
          broker_accdist: summary.detector?.broker_accdist || '-',
        },
      });

      if (top1Acc === 'Acc' || top1Acc === 'Big Acc') accumulationDays++;

      for (const b of buyers) {
        brokerNetByType[b.type] += b.bval;
        brokerVolumeByType[b.type] += b.bval;
        totalBrokerVolume += b.bval;
      }
      for (const s of sellers) {
        brokerNetByType[s.type] -= s.sval;
        brokerVolumeByType[s.type] += s.sval;
        totalBrokerVolume += s.sval;
      }
    } catch {
      // Skip day if no data
    }
  }

  const smartMoneyNet =
    brokerNetByType.Smartmoney + brokerNetByType.Whale;
  const retailNet = brokerNetByType.Retail;

  let flowMomentum = 50;
  if (totalBrokerVolume > 0) {
    const netRatio = (smartMoneyNet - retailNet) / totalBrokerVolume;
    flowMomentum = Math.min(100, Math.max(0, 50 + netRatio * 100));
  }

  const flowMomentumSignal: 'buy' | 'sell' | 'neutral' =
    flowMomentum >= 60 ? 'buy' : flowMomentum <= 40 ? 'sell' : 'neutral';

  let phase: BandarmologyResult['phase'] = 'neutral';
  if (accumulationDays >= 7) phase = 'late_accumulation';
  else if (accumulationDays >= 4) phase = 'mid_accumulation';
  else if (accumulationDays >= 2) phase = 'early_accumulation';
  else if (accumulationDays === 0 && smartMoneyNet < 0) phase = 'distribution';

  if (accumulationDays >= 5 && flowMomentum >= 65) phase = 'markup_ready';

  const brokerComposition: Record<BrokerType, number> = {
    Smartmoney: totalBrokerVolume > 0 ? (brokerVolumeByType.Smartmoney / totalBrokerVolume) * 100 : 0,
    Whale: totalBrokerVolume > 0 ? (brokerVolumeByType.Whale / totalBrokerVolume) * 100 : 0,
    Retail: totalBrokerVolume > 0 ? (brokerVolumeByType.Retail / totalBrokerVolume) * 100 : 0,
    Mix: totalBrokerVolume > 0 ? (brokerVolumeByType.Mix / totalBrokerVolume) * 100 : 0,
    Unknown: totalBrokerVolume > 0 ? (brokerVolumeByType.Unknown / totalBrokerVolume) * 100 : 0,
  };

  if (smartMoneyNet > 0 && accumulationDays >= 3) {
    patternAlerts.push('Smart money akumulasi: NET BUY');
  }
  if (retailNet < 0 && smartMoneyNet > 0) {
    patternAlerts.push('Contrarian bullish: Retail jual, smart money beli');
  }
  if (accumulationDays >= 5) {
    patternAlerts.push(`Akumulasi streak: ${accumulationDays} hari`);
  }

  let recommendation = 'NEUTRAL - Data tidak cukup untuk rekomendasi.';
  if (phase === 'late_accumulation' || phase === 'markup_ready') {
    recommendation = 'STRONG BUY - Akumulasi kuat, tunggu konfirmasi breakout.';
  } else if (phase === 'mid_accumulation') {
    recommendation = 'BUY - Pola akumulasi terdeteksi, monitor kelanjutan.';
  } else if (phase === 'distribution') {
    recommendation = 'CAUTION - Fase distribusi, hindari entry baru.';
  }

  const fromDate = dailyFlows.length > 0 ? dailyFlows[dailyFlows.length - 1].date : startStr;
  const toDate = dailyFlows.length > 0 ? dailyFlows[0].date : endStr;

  return {
    emiten,
    period: { from: fromDate, to: toDate, days: dailyFlows.length },
    flowMomentum: Math.round(flowMomentum),
    flowMomentumSignal,
    phase,
    brokerComposition,
    patternAlerts,
    recommendation,
    dailyFlows,
  };
}
