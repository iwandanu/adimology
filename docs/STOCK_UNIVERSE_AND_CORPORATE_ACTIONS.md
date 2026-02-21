# Stock Universe & Corporate Actions

## 1. Stock Universe Expansion

### Implemented (✅)
- **LQ45**: ~46 tickers (static) or dynamic via OHLC.dev when `OHLC_DEV_API_KEY` is set
- **IDX80**: ~66 tickers (static) or dynamic via OHLC.dev
- **Popular**: ~40 tickers (static)
- **Liquid**: LQ45 + IDX80 combined (~80 unique)
- **All**: ~955 tickers from `data/tickers.json` (Pulse-CLI) or dynamic via OHLC.dev securities list

**OHLC.dev**: When `OHLC_DEV_API_KEY` is configured in Netlify, the screener uses OHLC.dev IDX API for LQ45/IDX80/All universes (dynamic, up-to-date). Falls back to static lists when unset or on API failure.

### Previous State (for reference)

### Recommendations

#### Option A: Use Full IDX Ticker List (Recommended - Quick Win)
Pulse-CLI and similar projects use a full list of ~955 IDX tickers. Add `all` universe:

```typescript
// lib/universes.ts - add "all" from static JSON
// data/tickers.json from Pulse-CLI has 955 tickers
```

**Pros**: No API dependency, works offline  
**Cons**: List may become stale (new IPOs, delistings)  
**Update frequency**: Manual update every 6–12 months

#### Option B: Fetch from IDX API (Dynamic)
IDX has an internal API used by their website:
- **Endpoint**: `https://www.idx.co.id/primary/ListedCompany/GetCompanyProfiles?start=0&length=9999`
- **Returns**: JSON with KodeEmiten, NamaEmiten, sector, etc.

**Challenge**: Returns 403 with standard `fetch` (Cloudflare/bot protection).  
**Workaround**: Use [idx-bei](https://github.com/nichsedge/idx-bei) approach with `curl_cffi` (Python) or Playwright (Node) to mimic browser.

**Implementation**: Create a scheduled Netlify function (e.g. weekly) that uses Playwright to fetch and cache the list in Supabase.

#### Option C: Use Stockbit Watchlist as Universe
For users with Stockbit connected, use their watchlist items as the screening universe.

**Pros**: Personalized, no maintenance  
**Cons**: Requires auth, limited to user's watchlist

### Recommended Implementation Order
1. **Now**: Add `all` universe from Pulse-CLI tickers (~955) – static file
2. **Later**: Add "Watchlist" universe option when user has Stockbit connected
3. **Future**: Optional IDX API sync (scheduled job) for official list

---

## 2. Corporate Actions

### Source: https://www.idx.co.id/en/listed-companies/corporate-actions/

### Challenge
- IDX website uses JavaScript; data likely loaded via internal API
- Direct fetch returns **403 Forbidden** (bot protection)
- No official public API documented for corporate actions

### Implementation Options

#### Option A: Yahoo Finance (Easiest – Use What We Have)
Yahoo Finance provides dividend and stock split data via:
- `quoteSummary` with `summaryDetail` (dividend yield, ex-dividend date)
- `chart` with `events: 'div|split'` (dividend & split history)

**Pros**: No auth, already have yahoo-finance2, works for .JK symbols  
**Cons**: May not include all IDX corporate actions (rights issue, etc.)

#### Option B: Playwright Scraping (IDX Website)
Use Playwright (already in package.json) to:
1. Navigate to IDX corporate actions page
2. Wait for data to load
3. Extract table or API response

**Pros**: Official IDX data  
**Cons**: Heavy (browser), slow, may break if IDX changes layout, Netlify serverless has size limits

#### Option C: Third-Party API
- **Sectors.app** – API-first IDX data (paid)
- **OHLC.dev** – IDX API (paid)
- **Twelve Data** – Fundamentals include dividends (paid plan)

#### Option D: Netlify Function + IDX API with Browser Headers
Try fetching IDX's internal API with browser-like headers. The idx-bei project uses `curl_cffi` with `impersonate="chrome"`. In Node, we could try:
- `node-fetch` with exact Chrome headers
- Or a library like `got` with custom headers

IDX API pattern (from idx-bei):
- Base: `https://www.idx.co.id/primary/`
- Corporate actions might be under `ListedCompany/GetCorporateAction` or similar

### Implemented (✅)
1. **lib/corporateActions.ts** – Yahoo Finance `quoteSummary` (calendarEvents, summaryDetail, defaultKeyStatistics) + `chart` with `events: 'div|split'`
2. **/api/corporate-actions?emiten=BBCA** – Returns dividends, splits, ex-dividend date, dividend yield
3. **CorporateActionsCard** – Shown in Calculator when analyzing a stock
4. **Phase 3 (future)**: IDX scraping with Playwright if Yahoo data is insufficient

---

## References
- [idx-bei](https://github.com/nichsedge/idx-bei) – IDX scraper (Python, curl_cffi)
- [Pulse-CLI tickers](https://github.com/sukirman1901/Pulse-CLI/blob/main/data/tickers.json)
- [Yahoo Finance quoteSummary](https://github.com/gadicc/node-yahoo-finance2)
