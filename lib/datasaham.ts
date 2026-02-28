/**
 * Datasaham.io IDX API client (Indonesia Stock Exchange)
 * Uses x-api-key header. Set DATASAHAM_API_KEY (or legacy OHLC_DEV_API_KEY) in env.
 * Docs: `https://api.datasaham.io/swagger`
 */

const DATASAHAM_BASE = 'https://api.datasaham.io';

function getApiKey(): string | undefined {
  return process.env.DATASAHAM_API_KEY ?? process.env.OHLC_DEV_API_KEY;
}

async function fetchDatasaham<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL(path, DATASAHAM_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'x-api-key': key,
      },
    });

    if (!res.ok) {
      console.warn(`[Datasaham] ${path} returned ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    console.warn('[Datasaham] fetch error:', e);
    return null;
  }
}

/** Check if Datasaham API is configured */
export function isDatasahamConfigured(): boolean {
  return !!getApiKey();
}

/** OHLC row format compatible with technical analysis */
export interface OHLCDataRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

type UnknownRecord = Record<string, unknown>;

function extractCandles(raw: unknown): UnknownRecord[] {
  if (Array.isArray(raw)) {
    return raw as UnknownRecord[];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const obj = raw as UnknownRecord;

  if (Array.isArray(obj.data)) {
    return obj.data as UnknownRecord[];
  }

  if (Array.isArray(obj.result)) {
    return obj.result as UnknownRecord[];
  }

  if (Array.isArray(obj.candles)) {
    return obj.candles as UnknownRecord[];
  }

  const data = obj.data as UnknownRecord | undefined;
  if (data) {
    for (const value of Object.values(data)) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object'
      ) {
        const first = value[0] as UnknownRecord;
        if (
          'open' in first &&
          'high' in first &&
          'low' in first &&
          'close' in first
        ) {
          return value as UnknownRecord[];
        }
      }
    }
  }

  return [];
}

function normalizeDate(candle: UnknownRecord): string | null {
  const dateLike =
    (candle.date as string | undefined) ??
    (candle.time as string | undefined) ??
    (candle.timestamp as string | undefined);

  if (dateLike && typeof dateLike === 'string') {
    // Assume YYYY-MM-DD or ISO date-like string
    if (dateLike.length >= 10) {
      return dateLike.slice(0, 10);
    }
    return dateLike;
  }

  const epoch =
    (candle.time as number | undefined) ??
    (candle.timestamp as number | undefined);
  if (typeof epoch === 'number' && Number.isFinite(epoch)) {
    const ms = epoch > 1e12 ? epoch : epoch * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Fetch historical OHLC for screening using Datasaham chart endpoint.
 * Builds a map of stockCode -> OHLCDataRow[].
 *
 * NOTE: This function is intentionally defensive about response shape:
 * it looks for arrays under common keys and for objects with open/high/low/close.
 */
export async function fetchDatasahamHistoricalMap(
  tickers: string[],
  daysBack: number = 120
): Promise<Map<string, OHLCDataRow[]>> {
  const map = new Map<string, OHLCDataRow[]>();
  const key = getApiKey();
  if (!key || tickers.length === 0) return map;

  const limit = Math.max(30, Math.min(daysBack, 365));

  for (const rawSymbol of tickers) {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) continue;

    // Use daily timeframe for screening
    const raw = await fetchDatasaham<unknown>(
      `/api/chart/${encodeURIComponent(symbol)}/daily`,
      { limit }
    );

    if (!raw) continue;

    const candles = extractCandles(raw);
    if (!candles.length) continue;

    const rows: OHLCDataRow[] = [];

    for (const c of candles) {
      if (!c || typeof c !== 'object') continue;

      const rec = c as UnknownRecord;
      const date = normalizeDate(rec);
      const open = Number(rec.open);
      const high = Number(rec.high);
      const low = Number(rec.low);
      const close = Number(rec.close);

      if (
        !date ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        continue;
      }

      const volumeRaw = rec.volume ?? rec.vol;
      const volumeNumber =
        typeof volumeRaw === 'number'
          ? volumeRaw
          : typeof volumeRaw === 'string'
          ? Number(volumeRaw.replace(/,/g, ''))
          : undefined;

      rows.push({
        date,
        open,
        high,
        low,
        close,
        volume:
          typeof volumeNumber === 'number' && Number.isFinite(volumeNumber)
            ? volumeNumber
            : undefined,
      });
    }

    if (!rows.length) continue;

    rows.sort((a, b) => a.date.localeCompare(b.date));
    map.set(symbol, rows.slice(-daysBack));

    // Basic rate limiting to be friendly to the API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return map;
}

/**
 * Retail Opportunity helpers (Datasaham.io)
 * These mirror the Retail endpoints documented at https://api.datasaham.io/swagger
 */

export async function fetchRetailMultibaggerScan(
  limit: number = 20
): Promise<unknown | null> {
  return fetchDatasaham<unknown>('/api/analysis/retail/multibagger/scan', {
    limit,
  });
}

export async function fetchRetailBreakoutAlerts(
  limit: number = 30
): Promise<unknown | null> {
  return fetchDatasaham<unknown>('/api/analysis/retail/breakout/alerts', {
    limit,
  });
}

export async function fetchRetailRiskReward(
  symbol: string
): Promise<unknown | null> {
  if (!symbol) return null;
  return fetchDatasaham<unknown>(
    `/api/analysis/retail/risk-reward/${encodeURIComponent(symbol.toUpperCase())}`
  );
}

export async function fetchRetailSectorRotation(): Promise<unknown | null> {
  return fetchDatasaham<unknown>('/api/analysis/retail/sector-rotation');
}

/**
 * Market Sentiment helpers (Datasaham.io)
 * Retail vs Bandar sentiment analysis and IPO momentum tracking.
 */

export async function fetchMarketSentiment(
  symbol: string,
  days?: number
): Promise<unknown | null> {
  if (!symbol) return null;
  const params: Record<string, string | number> = {};
  if (days && Number.isFinite(days)) {
    params.days = days;
  }
  return fetchDatasaham<unknown>(
    `/api/analysis/sentiment/${encodeURIComponent(symbol.toUpperCase())}`,
    params
  );
}

/**
 * Advanced Analytics helpers (Datasaham.io)
 * Correlation matrix and multi-market screener.
 */

export async function fetchAdvancedCorrelation(
  symbols: string,
  periodDays?: number
): Promise<unknown | null> {
  if (!symbols.trim()) return null;
  const params: Record<string, string | number> = { symbols };
  if (periodDays && Number.isFinite(periodDays)) {
    params.period_days = periodDays;
  }
  return fetchDatasaham<unknown>('/api/analysis/correlation', params);
}

export interface MultiMarketScreenerParams {
  commodityExposure?: string;
  forexExposure?: 'exporter' | 'importer' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
}

export async function fetchAdvancedMultiMarketScreener(
  params: MultiMarketScreenerParams
): Promise<unknown | null> {
  const query: Record<string, string | number> = {};
  if (params.commodityExposure) query.commodityExposure = params.commodityExposure;
  if (params.forexExposure) query.forexExposure = params.forexExposure;
  if (typeof params.minPrice === 'number') query.minPrice = params.minPrice;
  if (typeof params.maxPrice === 'number') query.maxPrice = params.maxPrice;
  if (typeof params.minVolume === 'number') query.minVolume = params.minVolume;

  return fetchDatasaham<unknown>('/api/analysis/screener/multi-market', query);
}

/**
 * Fetch all sectors list from DataSaham API
 * Returns array of sector objects with id and name
 */
export interface DatasahamSector {
  id: string;
  name: string;
  performance?: {
    day: number;
    week: number;
    month: number;
  };
}

export async function fetchDatasahamSectors(): Promise<DatasahamSector[] | null> {
  const result = await fetchDatasaham<DatasahamSector[] | { sectors: DatasahamSector[] }>(
    '/api/sectors/'
  );
  
  if (!result) return null;
  
  // Handle if result is wrapped in an object
  if (Array.isArray(result)) {
    return result;
  }
  
  // Check if result has a sectors property
  if (typeof result === 'object' && 'sectors' in result && Array.isArray(result.sectors)) {
    return result.sectors;
  }
  
  console.warn('[fetchDatasahamSectors] Unexpected response format:', result);
  return null;
}

/**
 * Fetch companies in a specific sector from DataSaham API
 */
export interface DatasahamCompany {
  symbol: string;
  name: string;
  sector: string;
  subsector?: string;
  is_syariah?: boolean;
}

export async function fetchDatasahamSectorCompanies(
  sectorId: string
): Promise<DatasahamCompany[] | null> {
  const result = await fetchDatasaham<{ companies: DatasahamCompany[] }>(
    `/api/sectors/${sectorId}/companies`
  );
  return result?.companies || null;
}

/**
 * Build sector map from DataSaham API
 * Returns map of symbol -> sector name
 */
export async function buildSectorMapFromDatasaham(
  symbols: string[]
): Promise<Map<string, string>> {
  const sectorMap = new Map<string, string>();
  
  // Fetch all sectors first
  const sectors = await fetchDatasahamSectors();
  if (!sectors) return sectorMap;
  
  // Ensure sectors is an array
  if (!Array.isArray(sectors)) {
    console.warn('[buildSectorMapFromDatasaham] sectors is not an array:', typeof sectors);
    return sectorMap;
  }
  
  // For each sector, fetch companies and match symbols
  for (const sector of sectors) {
    const companies = await fetchDatasahamSectorCompanies(sector.id);
    if (!companies) continue;
    
    for (const company of companies) {
      const symbol = company.symbol.toUpperCase().replace('.JK', '');
      if (symbols.includes(symbol)) {
        sectorMap.set(symbol, sector.name);
      }
    }
    
    // Add delay to be API-friendly
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  
  return sectorMap;
}

