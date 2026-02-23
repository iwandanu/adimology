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

function extractTradingRows(raw: unknown): OHLCTradingSummary[] {
  if (Array.isArray(raw)) return raw as OHLCTradingSummary[];
  const obj = raw as Record<string, unknown>;
  const data = obj?.data ?? obj?.results ?? obj?.result;
  if (Array.isArray(data)) return data as OHLCTradingSummary[];
  const inner = data as Record<string, unknown> | undefined;
  if (inner?.result && Array.isArray(inner.result))
    return inner.result as OHLCTradingSummary[];
  return [];
}

/**
 * Fetch stock-summary per date (per-stock OHLC). Uses /trading/stock-summary
 * which works for most RapidAPI plans. Use for historical screening.
 */
async function fetchStockSummary(params: {
  date: string;
  length?: number;
}): Promise<OHLCTradingSummary[]> {
  const q: Record<string, string | number> = { date: params.date };
  if (params.length != null) q.length = params.length;

  const raw = await fetchOHLC<unknown>('/trading/stock-summary', q);
  return raw ? extractTradingRows(raw) : [];
}

/** OHLCData format compatible with technical analysis */
export interface OHLCDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Fetch historical OHLC for screening. Builds a map of stockCode -> OHLCData[]
 * by fetching trading summary for the last N trading days.
 * Requires OHLC_DEV_API_KEY. Returns empty map on failure.
 */
export async function fetchOHLCHistoricalMap(
  daysBack: number = 120
): Promise<Map<string, OHLCDataRow[]>> {
  const map = new Map<string, OHLCDataRow[]>();
  const key = getApiKey();
  if (!key) return map;

  const dates: string[] = [];
  const d = new Date();
  let count = 0;
  while (count < daysBack) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const yyyymmdd = `${y}${m}${day}`;
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.push(yyyymmdd);
      count++;
    }
    d.setDate(d.getDate() - 1);
  }

  for (const date of dates) {
    const rows = await fetchStockSummary({ date, length: 3000 });
    for (const row of rows) {
      const code = String(row.stockCode ?? row.code ?? '').trim().toUpperCase();
      if (
        !code ||
        typeof row.open !== 'number' ||
        typeof row.high !== 'number' ||
        typeof row.low !== 'number' ||
        typeof row.close !== 'number'
      )
        continue;
      const dateStr = row.date ?? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      const item: OHLCDataRow = {
        date: dateStr,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: typeof row.volume === 'number' ? row.volume : undefined,
      };
      const list = map.get(code) ?? [];
      list.push(item);
      map.set(code, list);
    }
    await new Promise((r) => setTimeout(r, 1100)); // ~1 req/sec to respect RapidAPI limit
  }

  for (const [, list] of map) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return map;
}
