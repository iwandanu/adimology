/**
 * OHLC.dev IDX API client (Indonesia Stock Exchange)
 * Uses RapidAPI-hosted endpoint. Set OHLC_DEV_API_KEY in Netlify env.
 * Docs: https://ohlc.dev/indonesia-stock-exchange-idx-api
 */

const OHLC_BASE = 'https://indonesia-stock-exchange-idx.p.rapidapi.com';
const OHLC_HOST = 'indonesia-stock-exchange-idx.p.rapidapi.com';

function getApiKey(): string | undefined {
  return process.env.OHLC_DEV_API_KEY;
}

async function fetchOHLC<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL(path, OHLC_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': OHLC_HOST,
      },
    });
    if (!res.ok) {
      console.warn(`[OHLC.dev] ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn('[OHLC.dev] fetch error:', e);
    return null;
  }
}

/** Check if OHLC.dev API is configured and reachable */
export function isOHLCConfigured(): boolean {
  return !!getApiKey();
}

/** Stock constituent (e.g. LQ45 member) */
export interface OHLCConstituent {
  stockCode?: string;
  code?: string;
  name?: string;
  [key: string]: unknown;
}

/** Response from constituents endpoint */
export interface OHLCConstituentsResponse {
  data?: OHLCConstituent[];
  results?: OHLCConstituent[];
  [key: string]: unknown;
}

/**
 * Fetch index constituents (e.g. LQ45, IDX80).
 * indexCode: LQ45 | IDX80 | etc.
 */
export async function fetchConstituents(
  indexCode: string
): Promise<string[]> {
  const raw = await fetchOHLC<OHLCConstituentsResponse>(
    '/stock-data/constituents',
    { indexCode }
  );
  if (!raw) return [];

  const list = (raw.data ?? raw.results ?? []) as OHLCConstituent[];
  const codes = list
    .map((r) => r.stockCode ?? r.code)
    .filter((c): c is string => !!c && typeof c === 'string');
  return [...new Set(codes)];
}

/** Security/stock from securities list */
export interface OHLCSecurity {
  stockCode?: string;
  code?: string;
  name?: string;
  sector?: string;
  [key: string]: unknown;
}

/** Response from securities endpoint */
export interface OHLCSecuritiesResponse {
  data?: OHLCSecurity[];
  results?: OHLCSecurity[];
  [key: string]: unknown;
}

/**
 * Fetch all listed securities (stock codes).
 * Use when OHLC is configured for dynamic "all" universe.
 */
export async function fetchSecurities(params?: {
  start?: number;
  length?: number;
  sector?: string;
  board?: string;
}): Promise<string[]> {
  const q: Record<string, string | number> = {};
  if (params?.start != null) q.start = params.start;
  if (params?.length != null) q.length = params.length;
  if (params?.sector) q.sector = params.sector;
  if (params?.board) q.board = params.board;

  const raw = await fetchOHLC<OHLCSecuritiesResponse>(
    '/stock-data/securities',
    Object.keys(q).length ? q : undefined
  );
  if (!raw) return [];

  const list = (raw.data ?? raw.results ?? []) as OHLCSecurity[];
  const codes = list
    .map((r) => r.stockCode ?? r.code)
    .filter((c): c is string => !!c && typeof c === 'string');
  return [...new Set(codes)];
}

/** Daily trading summary for a stock */
export interface OHLCTradingSummary {
  stockCode?: string;
  date?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  value?: number;
  change?: number;
  percentageChange?: number;
  sector?: string;
  [key: string]: unknown;
}

/** Response from trading summary */
export interface OHLCTradingSummaryResponse {
  data?: OHLCTradingSummary[];
  results?: OHLCTradingSummary[];
  [key: string]: unknown;
}

/**
 * Fetch trading summary (OHLC, volume) for screening or price data.
 * date: YYYYMMDD (optional)
 */
export async function fetchTradingSummary(params?: {
  date?: string;
  start?: number;
  length?: number;
}): Promise<OHLCTradingSummary[]> {
  const q: Record<string, string | number> = {};
  if (params?.date) q.date = params.date;
  if (params?.start != null) q.start = params.start;
  if (params?.length != null) q.length = params.length;

  const raw = await fetchOHLC<OHLCTradingSummaryResponse>(
    '/trading/summary',
    Object.keys(q).length ? q : undefined
  );
  if (!raw) return [];

  const list = (raw.data ?? raw.results ?? []) as OHLCTradingSummary[];
  return Array.isArray(list) ? list : [];
}
