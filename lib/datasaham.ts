/**
 * Datasaham.io IDX API client (Indonesia Stock Exchange)
 * Uses x-api-key header. Set DATASAHAM_API_KEY (or legacy OHLC_DEV_API_KEY) in env.
 * Docs: `https://api.datasaham.io/swagger`
 */

const DATASAHAM_BASE = 'https://api.datasaham.io';

function getApiKey(): string | undefined {
  return process.env.DATASAHAM_API_KEY ?? process.env.OHLC_DEV_API_KEY;
}

/**
 * Rate limit state tracking
 */
let rateLimitRemaining: number | null = null;
let rateLimitReset: number | null = null;

async function fetchDatasaham<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T | null> {
  const key = getApiKey();
  if (!key) {
    console.warn('[Datasaham] No API key configured');
    return null;
  }

  // Check rate limit before making request
  if (rateLimitRemaining !== null && rateLimitRemaining <= 0) {
    if (rateLimitReset && Date.now() < rateLimitReset) {
      const waitMs = rateLimitReset - Date.now();
      console.warn(`[Datasaham] Rate limit exceeded. Waiting ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs + 100));
    }
  }

  const url = new URL(path, DATASAHAM_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const fullUrl = url.toString();

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(fullUrl, {
      headers: {
        'x-api-key': key,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Update rate limit tracking from response headers
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const reset = res.headers.get('X-RateLimit-Reset');
    const limit = res.headers.get('X-RateLimit-Limit');
    
    if (remaining) rateLimitRemaining = parseInt(remaining, 10);
    if (reset) rateLimitReset = parseInt(reset, 10) * 1000; // Convert to ms
    
    // Only log rate limit every 10 requests or when low
    const shouldLogRateLimit = 
      !rateLimitRemaining || 
      rateLimitRemaining < 20 || 
      rateLimitRemaining % 10 === 0;
    
    if (limit && rateLimitRemaining !== null && shouldLogRateLimit) {
      console.log(`[Datasaham] Rate limit: ${rateLimitRemaining}/${limit} remaining`);
    }

    if (!res.ok) {
      // Log the full URL and status for debugging
      console.warn(`[Datasaham] HTTP ${res.status} - GET ${fullUrl}`);
      
      // Try to get error details from response
      try {
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorJson = await res.json();
          console.warn(`[Datasaham] Error details:`, JSON.stringify(errorJson).substring(0, 300));
        } else {
          const errorText = await res.text();
          if (errorText) {
            console.warn(`[Datasaham] Error response:`, errorText.substring(0, 200));
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
      
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[Datasaham] Fetch error for ${fullUrl}:`, e instanceof Error ? e.message : String(e));
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

  // Handle direct array fields
  if (Array.isArray(obj.data)) {
    return obj.data as UnknownRecord[];
  }

  if (Array.isArray(obj.result)) {
    return obj.result as UnknownRecord[];
  }

  if (Array.isArray(obj.candles)) {
    return obj.candles as UnknownRecord[];
  }
  
  if (Array.isArray(obj.chartbit)) {
    return obj.chartbit as UnknownRecord[];
  }

  // Handle nested structure: { data: { data: { chartbit: [...] } } }
  const data = obj.data as UnknownRecord | undefined;
  if (data) {
    // Check for chartbit directly in data
    if (Array.isArray(data.chartbit)) {
      return data.chartbit as UnknownRecord[];
    }
    
    // Check for nested data.data.chartbit (DataSaham structure)
    const nestedData = data.data as UnknownRecord | undefined;
    if (nestedData && Array.isArray(nestedData.chartbit)) {
      return nestedData.chartbit as UnknownRecord[];
    }
    
    // Fallback: search all values in data object
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
 * Fetch historical OHLC for screening.
 * First tries DataSaham API, falls back to Yahoo Finance if needed.
 */
export async function fetchDatasahamHistoricalMap(
  tickers: string[],
  daysBack: number = 120
): Promise<Map<string, OHLCDataRow[]>> {
  const map = new Map<string, OHLCDataRow[]>();
  const key = getApiKey();
  
  // If no DataSaham API key, use Yahoo Finance directly
  if (!key) {
    console.warn('[Datasaham] No API key found, using Yahoo Finance as fallback for all stocks');
    return await fetchHistoricalMapFromYahoo(tickers, daysBack);
  }

  let datasahamFailures = 0;
  
  // Calculate date range for DataSaham API (requires from and to parameters)
  // Note: DataSaham filters out weekends/holidays, so to get 252 trading days,
  // we need to request ~365 calendar days (252 * 1.45 ≈ 365)
  const endDate = new Date();
  const startDate = new Date();
  const calendarDaysNeeded = Math.ceil(daysBack * 1.45); // Add 45% buffer for weekends/holidays
  startDate.setDate(startDate.getDate() - calendarDaysNeeded);
  
  const fromDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const toDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`[Datasaham] Fetching ${daysBack} trading days (${fromDate} to ${toDate}, ${calendarDaysNeeded} calendar days)`);
  console.log(`[Datasaham] Processing ${tickers.length} stocks sequentially...`);

  let processedCount = 0;
  const progressInterval = Math.max(1, Math.floor(tickers.length / 10)); // Log every 10%

  for (const rawSymbol of tickers) {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) continue;

    processedCount++;
    
    // Show progress every N stocks
    if (processedCount % progressInterval === 0 || processedCount === tickers.length) {
      const percent = Math.round((processedCount / tickers.length) * 100);
      console.log(`[Datasaham] Progress: ${processedCount}/${tickers.length} (${percent}%) - Success: ${map.size}, Failed: ${datasahamFailures}`);
    }

    // DataSaham API expects symbols WITHOUT .JK suffix
    const cleanSymbol = symbol.replace('.JK', '');

    // DataSaham API format: GET /api/chart/{symbol}/{timeframe}?from=YYYY-MM-DD&to=YYYY-MM-DD
    const endpoint = `/api/chart/${encodeURIComponent(cleanSymbol)}/daily`;
    
    // Log first 5 requests for debugging
    if (processedCount <= 5) {
      console.log(`[Datasaham] [${processedCount}] Fetching ${cleanSymbol}...`);
    }
    
    try {
      const raw = await fetchDatasaham<unknown>(endpoint, { 
        from: fromDate,
        to: toDate,
        limit: 0 // 0 = no limit, get all data in range
      });

      if (!raw) {
        datasahamFailures++;
        if (processedCount <= 5) {
          console.log(`[Datasaham] [${processedCount}] ${cleanSymbol} - DataSaham failed, trying Yahoo...`);
        }
        // Fallback to Yahoo Finance for this specific stock
        const yahooSymbol = cleanSymbol + '.JK';
        const yahooData = await fetchYahooForSymbol(yahooSymbol, daysBack);
        if (yahooData) {
          map.set(symbol, yahooData);
          if (processedCount <= 5) {
            console.log(`[Datasaham] [${processedCount}] ${cleanSymbol} - Yahoo success: ${yahooData.length} days`);
          }
        }
        continue;
      }

      const candles = extractCandles(raw);
      if (!candles.length) {
        datasahamFailures++;
        if (processedCount <= 5) {
          console.log(`[Datasaham] [${processedCount}] ${cleanSymbol} - No candles found, trying Yahoo...`);
        }
        // Fallback to Yahoo Finance
        const yahooSymbol = cleanSymbol + '.JK';
        const yahooData = await fetchYahooForSymbol(yahooSymbol, daysBack);
        if (yahooData) {
          map.set(symbol, yahooData);
        }
        continue;
      }

      // Process candles into OHLC rows
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
      
      if (processedCount <= 5) {
        console.log(`[Datasaham] [${processedCount}] ${cleanSymbol} - Success: ${rows.length} days`);
      }

    } catch (error) {
      datasahamFailures++;
      console.error(`[Datasaham] [${processedCount}] ${cleanSymbol} - Error:`, error instanceof Error ? error.message : String(error));
      // Try Yahoo Finance as fallback
      const yahooSymbol = cleanSymbol + '.JK';
      const yahooData = await fetchYahooForSymbol(yahooSymbol, daysBack);
      if (yahooData) {
        map.set(symbol, yahooData);
      }
      continue;
    }

    // Intelligent rate limiting: shorter delay if we have remaining quota
    const delayMs = rateLimitRemaining && rateLimitRemaining > 50 ? 100 : 300;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // If most requests failed, log a warning
  if (datasahamFailures > tickers.length * 0.5) {
    console.warn(`[Datasaham] High failure rate: ${datasahamFailures}/${tickers.length} stocks failed, using Yahoo Finance fallback`);
  }

  return map;
}

/**
 * Fetch historical data from Yahoo Finance for a single symbol
 */
async function fetchYahooForSymbol(symbol: string, daysBack: number): Promise<OHLCDataRow[] | null> {
  try {
    // Dynamic import to avoid bundling issues
    const { fetchYahooHistorical } = await import('./yahooFinance');
    const data = await fetchYahooHistorical(symbol.replace('.JK', ''), daysBack);
    return data || null;
  } catch (error) {
    console.warn(`[Yahoo Finance] Failed to fetch ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch all tickers using Yahoo Finance (fallback)
 */
async function fetchHistoricalMapFromYahoo(
  tickers: string[],
  daysBack: number
): Promise<Map<string, OHLCDataRow[]>> {
  const map = new Map<string, OHLCDataRow[]>();
  
  for (const ticker of tickers) {
    const data = await fetchYahooForSymbol(ticker, daysBack);
    if (data) {
      map.set(ticker, data);
    }
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
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
  const response = await fetchDatasaham<any>('/api/sectors/');
  
  if (!response) {
    console.error('[fetchDatasahamSectors] No response from API');
    return null;
  }
  
  // Handle nested response structure: { success: true, data: { data: [...], message: '...' } }
  let sectorsData: any[] = [];
  
  if (Array.isArray(response)) {
    sectorsData = response;
  } else if (response.data) {
    if (Array.isArray(response.data)) {
      sectorsData = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      sectorsData = response.data.data;
    }
  }
  
  if (!sectorsData.length) {
    console.error('[fetchDatasahamSectors] Unexpected response format:', JSON.stringify(response).substring(0, 500));
    return null;
  }
  
  console.log(`[fetchDatasahamSectors] Found ${sectorsData.length} sectors`);
  
  // Transform to our interface
  return sectorsData.map((s: any) => ({
    id: String(s.id || s.sector_id || s.code),
    name: s.name || s.sector_name || 'Unknown',
    performance: s.performance
  }));
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
  // First try to get subsectors for this sector
  const subsectorsResponse = await fetchDatasaham<any>(
    `/api/sectors/${sectorId}/subsectors`
  );
  
  if (!subsectorsResponse) {
    console.warn(`[fetchDatasahamSectorCompanies] No subsectors found for sector ${sectorId}`);
    return [];
  }

  const companies: DatasahamCompany[] = [];

  // Handle nested structure for subsectors
  let subsectors: any[] = [];
  if (Array.isArray(subsectorsResponse)) {
    subsectors = subsectorsResponse;
  } else if (subsectorsResponse.data) {
    if (Array.isArray(subsectorsResponse.data)) {
      subsectors = subsectorsResponse.data;
    } else if (subsectorsResponse.data.data && Array.isArray(subsectorsResponse.data.data)) {
      subsectors = subsectorsResponse.data.data;
    }
  }

  // For each subsector, fetch companies
  for (const subsector of subsectors) {
    const subsectorId = subsector.id || subsector.subsector_id;
    if (!subsectorId) continue;

    const companiesResponse = await fetchDatasaham<any>(
      `/api/sectors/${sectorId}/subsectors/${subsectorId}/companies`
    );

    if (!companiesResponse) continue;

    // Extract companies array
    let companyList: any[] = [];
    if (Array.isArray(companiesResponse)) {
      companyList = companiesResponse;
    } else if (companiesResponse.data) {
      if (Array.isArray(companiesResponse.data)) {
        companyList = companiesResponse.data;
      } else if (companiesResponse.data.data && Array.isArray(companiesResponse.data.data)) {
        companyList = companiesResponse.data.data;
      } else if (companiesResponse.data.companies && Array.isArray(companiesResponse.data.companies)) {
        companyList = companiesResponse.data.companies;
      }
    }

    for (const company of companyList) {
      companies.push({
        symbol: (company.symbol || company.code || '').replace('.JK', ''),
        name: company.name || company.company_name || '',
        sector: subsector.sector_name || subsector.name || '',
        subsector: subsector.name || subsector.subsector_name,
        is_syariah: company.is_syariah || company.syariah
      });
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`[fetchDatasahamSectorCompanies] Sector ${sectorId}: Found ${companies.length} companies across ${subsectors.length} subsectors`);
  return companies;
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

