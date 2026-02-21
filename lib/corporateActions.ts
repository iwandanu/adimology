/**
 * Corporate actions (dividends, splits) from Yahoo Finance
 * Indonesian stocks use .JK suffix
 */

import YahooFinance from 'yahoo-finance2';

const IDX_SUFFIX = '.JK';

export interface DividendInfo {
  date: string;
  amount: number;
  type: 'dividend';
}

export interface SplitInfo {
  date: string;
  ratio: string;
  type: 'split';
}

export interface CorporateActions {
  emiten: string;
  dividends: DividendInfo[];
  splits: SplitInfo[];
  exDividendDate?: string;
  dividendDate?: string;
  dividendYield?: number;
  dividendRate?: number;
  lastDividendDate?: string;
  lastDividendValue?: number;
}

export async function getCorporateActions(emiten: string): Promise<CorporateActions> {
  const symbol = emiten.includes('.') ? emiten : `${emiten}${IDX_SUFFIX}`;
  const yf = new YahooFinance();

  const out: CorporateActions = {
    emiten: emiten.toUpperCase(),
    dividends: [],
    splits: [],
  };

  try {
    // 1. quoteSummary: calendarEvents (ex-dividend, next dividend date), summaryDetail (yield, rate)
    const summary = await yf.quoteSummary(symbol, {
      modules: ['calendarEvents', 'summaryDetail', 'defaultKeyStatistics'],
    });

    if (summary.calendarEvents) {
      const ce = summary.calendarEvents;
      if (ce.exDividendDate) {
        out.exDividendDate = ce.exDividendDate instanceof Date
          ? ce.exDividendDate.toISOString().split('T')[0]
          : String(ce.exDividendDate);
      }
      if (ce.dividendDate) {
        out.dividendDate = ce.dividendDate instanceof Date
          ? ce.dividendDate.toISOString().split('T')[0]
          : String(ce.dividendDate);
      }
    }

    if (summary.summaryDetail) {
      out.dividendYield = summary.summaryDetail.dividendYield;
      out.dividendRate = summary.summaryDetail.dividendRate;
    }

    if (summary.defaultKeyStatistics) {
      const dks = summary.defaultKeyStatistics;
      if (dks.lastDividendDate) {
        out.lastDividendDate = dks.lastDividendDate instanceof Date
          ? dks.lastDividendDate.toISOString().split('T')[0]
          : String(dks.lastDividendDate);
      }
      out.lastDividendValue = dks.lastDividendValue;
      if (dks.lastSplitFactor) {
        out.splits.push({
          date: dks.lastSplitDate
            ? new Date(dks.lastSplitDate).toISOString().split('T')[0]
            : '-',
          ratio: dks.lastSplitFactor,
          type: 'split',
        });
      }
    }

    // 2. chart with events for historical dividends and splits (last 2 years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    const chartResult = await yf.chart(symbol, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
      events: 'div|split',
    });

    type ChartEvents = {
      dividends?: Array<{ amount: number; date: Date | number }> | Record<string, { amount: number; date: Date | number }>;
      splits?: Array<{ date: Date | number; numerator: number; denominator: number; splitRatio?: string }> | Record<string, { date: Date | number; numerator: number; denominator: number }>;
    };
    const events = (chartResult as { events?: ChartEvents })?.events;

    if (events?.dividends) {
      const arr = Array.isArray(events.dividends) ? events.dividends : Object.values(events.dividends);
      const divs = arr
        .map((v) => {
          const d = v.date instanceof Date ? v.date : new Date(typeof v.date === 'number' && v.date < 1e10 ? v.date * 1000 : v.date);
          return { date: d.toISOString().split('T')[0], amount: v.amount, type: 'dividend' as const };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);
      out.dividends = divs;
    }

    if (events?.splits && !out.splits.length) {
      const arr = Array.isArray(events.splits) ? events.splits : Object.values(events.splits);
      const sp = arr
        .map((v) => {
          const d = v.date instanceof Date ? v.date : new Date(typeof v.date === 'number' && v.date < 1e10 ? v.date * 1000 : v.date);
          const ratio = ('splitRatio' in v && v.splitRatio) || `${v.numerator}:${v.denominator}`;
          return { date: d.toISOString().split('T')[0], ratio, type: 'split' as const };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
      out.splits = sp;
    }
  } catch {
    // Return empty; API will surface via success: false if needed
  }

  return out;
}
