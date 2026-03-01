# DataSaham API Fixes - 2026-02-28

## Issues Fixed

### 1. ❌ Wrong Endpoint Format

**Problem:**
```typescript
// OLD - INCORRECT
`/api/chart/${symbol}/daily`  // Missing required parameters
```

**Solution:**
```typescript
// NEW - CORRECT (using /latest endpoint)
`/api/chart/${symbol}/daily/latest?limit=252`
```

**Why:**
According to [DataSaham API documentation](https://api.datasaham.io/swagger#tag/chart/GET/api/chart/{symbol}/{timeframe}), there are two correct endpoint formats:

**A. Time Range Query** (requires `from` and `to` dates):
```
GET /api/chart/{symbol}/{timeframe}?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=0
```

**B. Latest N Candles** (simpler, just needs `limit`):
```
GET /api/chart/{symbol}/{timeframe}/latest?limit=N
```

We chose option B (`/latest`) because:
- ✅ No need to calculate date ranges
- ✅ Simpler API call
- ✅ Gets most recent N candles automatically
- ✅ Max limit: 5000 candles (updated from 365)

### 2. ⚠️ Missing Rate Limit Handling

**Problem:**
```typescript
// OLD - Basic delay, no intelligent handling
await new Promise((resolve) => setTimeout(resolve, 200));
```

**Solution:**
```typescript
// NEW - Intelligent rate limit tracking
let rateLimitRemaining: number | null = null;
let rateLimitReset: number | null = null;

// In fetchDatasaham():
// 1. Check rate limit before request
if (rateLimitRemaining !== null && rateLimitRemaining <= 0) {
  if (rateLimitReset && Date.now() < rateLimitReset) {
    const waitMs = rateLimitReset - Date.now();
    console.warn(`[Datasaham] Rate limit exceeded. Waiting ${Math.ceil(waitMs / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitMs + 100));
  }
}

// 2. Track rate limit from response headers
const remaining = res.headers.get('X-RateLimit-Remaining');
const reset = res.headers.get('X-RateLimit-Reset');
const limit = res.headers.get('X-RateLimit-Limit');

if (remaining) rateLimitRemaining = parseInt(remaining, 10);
if (reset) rateLimitReset = parseInt(reset, 10) * 1000;

// 3. Adaptive delay based on remaining quota
const delayMs = rateLimitRemaining && rateLimitRemaining > 50 ? 100 : 300;
await new Promise((resolve) => setTimeout(resolve, delayMs));
```

**Why:**
According to [DataSaham rate limiting docs](https://api.datasaham.io/swagger#description/rate-limiting), the API provides these response headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Unix timestamp when rate limit resets

**Benefits:**
- 🚀 **Faster when quota is available** (100ms vs 300ms delay)
- 🛡️ **Prevents 429 errors** (waits if limit exceeded)
- 📊 **Visibility** (logs remaining quota)
- 🎯 **Adaptive** (slows down when approaching limit)

### 3. 📝 Updated Limit Range

**Problem:**
```typescript
const limit = Math.max(30, Math.min(daysBack, 365)); // Max was 365
```

**Solution:**
```typescript
const limit = Math.max(30, Math.min(daysBack, 5000)); // API max is 5000
```

**Why:**
API documentation shows `limit` parameter with max 5000 candles, not 365.

## Changes Summary

### File: `lib/datasaham.ts`

#### Rate Limit Tracking (New)
```typescript
// Lines 7-9
let rateLimitRemaining: number | null = null;
let rateLimitReset: number | null = null;
```

#### Enhanced `fetchDatasaham()` Function
**Added:**
- Pre-request rate limit checking
- Automatic waiting if rate limit exceeded
- Response header parsing for rate limit tracking
- Logging of remaining quota

#### Fixed `fetchDatasahamHistoricalMap()` Function
**Changed:**
1. Endpoint: `/api/chart/{symbol}/daily` → `/api/chart/{symbol}/daily/latest`
2. Limit: max 365 → max 5000
3. Rate limiting: static 200ms → adaptive 100-300ms based on quota

## Testing Checklist

To verify the fixes work:

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to Minervini screener
# http://localhost:3000/minervini-screener

# 3. Check console logs for:
```

**Expected logs:**
```
✅ [Datasaham] Rate limit: 95/100 remaining
✅ [Minervini] Fetched OHLC data for 70 stocks
```

**NOT expected (should be gone):**
```
❌ [Datasaham] /api/chart/TLKM/daily returned 422
❌ [Datasaham] /api/chart/ASII/daily returned 400
```

## API Documentation References

1. **Chart Endpoint**: https://api.datasaham.io/swagger#tag/chart/GET/api/chart/{symbol}/{timeframe}
   - Shows two endpoint formats: time range query vs latest N candles
   - Documents timeframe options: `daily`, `1m`, `5m`, `10m`, `15m`, `30m`, `45m`, `1h`, `2h`, `3h`, `4h`
   - Max limit: 5000 candles

2. **Rate Limiting**: https://api.datasaham.io/swagger#description/rate-limiting
   - Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
   - Rate limits based on subscription tier

## Performance Impact

### Before
- ❌ 422 errors for many stocks
- ❌ Static 200ms delay for all requests
- ❌ No rate limit awareness
- ⏱️ ~40-50 seconds for 70 stocks (with Yahoo fallback)

### After
- ✅ Correct API endpoint usage
- ✅ Adaptive delays (100-300ms)
- ✅ Intelligent rate limit handling
- ✅ Better logging and visibility
- ⏱️ Expected: ~20-30 seconds for 70 stocks (fewer fallbacks to Yahoo)

## Fallback Strategy

The system maintains a robust fallback:

```
DataSaham API (primary)
    ↓ (if fails)
Yahoo Finance (fallback)
    ↓ (if fails)
Stock skipped
```

This ensures screening continues even if DataSaham API has issues.

## Future Improvements

1. **Batch Requests**: Check if DataSaham supports batch endpoints
2. **Caching**: Cache daily data (doesn't change during trading day)
3. **Retry Logic**: Exponential backoff for transient errors
4. **Health Check**: Ping endpoint before bulk requests
5. **Monitoring**: Track success/failure rates per API source

## Related Files

- `lib/datasaham.ts` - Main API client (FIXED)
- `lib/yahooFinance.ts` - Fallback data source
- `app/api/minervini-screener/route.ts` - Uses the API client

## Version

- **Fixed on**: 2026-02-28
- **API Version**: v1.0.0
- **API Base**: https://api.datasaham.io

---

**Note**: This fix should significantly reduce the number of 422 errors and improve overall screening reliability and performance.
