# DataSaham API Debugging Improvements - 2026-02-28

## Problem

User reported that:
1. ❌ No screening results (0 stocks passed)
2. ❌ Can't see actual API endpoints being called
3. ❌ Rate limit logs flooding the console (hiding useful info)
4. ❌ All stocks show "insufficient data (170 days)" but need 252

## Root Causes Identified

### 1. Verbose Rate Limit Logging
**Problem:** Every API call logged rate limit (68 times), hiding critical errors
```
[Datasaham] Rate limit: 99/100 remaining  ← Repeated 68 times
[Datasaham] Rate limit: 99/100 remaining
[Datasaham] Rate limit: 99/100 remaining
...
```

**Fix:** Only log rate limit:
- Every 10 requests
- When quota is low (< 20 remaining)
- When initially null

### 2. Missing URL in Error Logs
**Problem:** Errors showed path but not full URL with params
```
[Datasaham] /api/chart/TLKM/daily/latest returned 404  ← No query params shown!
```

**Fix:** Log full URL with query parameters
```
[Datasaham] HTTP 404 - GET https://api.datasaham.io/api/chart/TLKM/daily/latest?limit=252
[Datasaham] Error details: {"error": "Symbol not found"}
```

### 3. No Error Response Body
**Problem:** Couldn't see what the API actually returned
**Fix:** Parse and log error response (JSON or text, up to 300 chars)

### 4. Yahoo Finance Insufficient Data
**Problem:** Requesting 252 days but only getting 170 days

**Root Cause:** Yahoo Finance counts **trading days** internally, but the date range we provide uses **calendar days**. 

- We requested 252 calendar days ago → present
- Yahoo returned only ~170 trading days (252 calendar days includes ~70 weekends)

**Fix:** Request 1.5x more calendar days to ensure we get enough trading days
```typescript
// OLD: Request 252 calendar days
startDate.setDate(startDate.getDate() - daysBack);

// NEW: Request 378 calendar days to get ~252 trading days
const calendarDaysNeeded = Math.ceil(daysBack * 1.5);
startDate.setDate(startDate.getDate() - calendarDaysNeeded);
```

## Changes Made

### File: `lib/datasaham.ts`

#### 1. Enhanced Error Logging
```typescript
if (!res.ok) {
  // Log full URL
  console.warn(`[Datasaham] HTTP ${res.status} - GET ${fullUrl}`);
  
  // Parse error response (JSON or text)
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const errorJson = await res.json();
    console.warn(`[Datasaham] Error details:`, JSON.stringify(errorJson).substring(0, 300));
  } else {
    const errorText = await res.text();
    console.warn(`[Datasaham] Error response:`, errorText.substring(0, 200));
  }
}
```

#### 2. Reduced Rate Limit Logging
```typescript
// Only log every 10 requests or when low
const shouldLogRateLimit = 
  !rateLimitRemaining || 
  rateLimitRemaining < 20 || 
  rateLimitRemaining % 10 === 0;

if (limit && rateLimitRemaining !== null && shouldLogRateLimit) {
  console.log(`[Datasaham] Rate limit: ${rateLimitRemaining}/${limit} remaining`);
}
```

#### 3. Log First Few API Calls
```typescript
// In fetchDatasahamHistoricalMap():
console.log(`[Datasaham] Fetching historical data for ${tickers.length} stocks (limit: ${limit} days)`);

// Log first 3 requests for debugging
if (datasahamFailures + (map.size) < 3) {
  console.log(`[Datasaham] Calling: ${endpoint}?limit=${limit}`);
}
```

#### 4. Better Error Messages
```typescript
if (!key) {
  console.warn('[Datasaham] No API key configured');
  return null;
}

catch (e) {
  console.warn(`[Datasaham] Fetch error for ${fullUrl}:`, e instanceof Error ? e.message : String(e));
  return null;
}
```

### File: `lib/yahooFinance.ts`

#### 1. Fixed Calendar Days Calculation
```typescript
// Yahoo Finance returns trading days only, but we specify calendar days
// To get ~252 trading days, we need ~365 calendar days (accounting for weekends + holidays)
// Add 50% buffer to ensure we get enough data
const calendarDaysNeeded = Math.ceil(daysBack * 1.5);
startDate.setDate(startDate.getDate() - calendarDaysNeeded);
```

**Math:**
- 252 trading days ≈ 1 year of market data
- 365 calendar days = 1 year
- 365 - 104 weekends - ~10 holidays ≈ 251 trading days
- So multiply by 1.5 to be safe: 252 × 1.5 = 378 calendar days

#### 2. Added Data Length Logging
```typescript
const ohlcData = quotes.filter(...).map(...);

console.log(`[Yahoo] ${symbol}: Received ${ohlcData.length} days of data (requested ${daysBack})`);

return ohlcData;
```

## Expected Console Output (After Fix)

### Good Case (DataSaham Working)
```
[Datasaham] Fetching historical data for 68 stocks (limit: 252 days)
[Datasaham] Calling: /api/chart/TLKM/daily/latest?limit=252
[Datasaham] Calling: /api/chart/ASII/daily/latest?limit=252
[Datasaham] Calling: /api/chart/UNVR/daily/latest?limit=252
[Datasaham] Rate limit: 90/100 remaining
[Datasaham] Rate limit: 80/100 remaining
[Minervini] Fetched OHLC data for 68 stocks
[Minervini] Building sector map from static data...
[Minervini] Built sector map with 68 entries (0 unknown)
[Minervini] Screening complete: 12 stocks passed with score >= 6
```

### Error Case (DataSaham Failing)
```
[Datasaham] Fetching historical data for 68 stocks (limit: 252 days)
[Datasaham] Calling: /api/chart/TLKM/daily/latest?limit=252
[Datasaham] HTTP 404 - GET https://api.datasaham.io/api/chart/TLKM/daily/latest?limit=252
[Datasaham] Error details: {"error":"Symbol not found","message":"TLKM is not available"}
[Yahoo] TLKM.JK: Received 254 days of data (requested 252)
[Yahoo] ASII.JK: Received 253 days of data (requested 252)
[Datasaham] High failure rate: 68/68 stocks failed, using Yahoo Finance fallback
[Minervini] Fetched OHLC data for 68 stocks
[Minervini] Screening complete: 8 stocks passed with score >= 6
```

## Testing Instructions

1. **Clear terminal** (easier to see new output)
2. **Run dev server**: `npm run dev`
3. **Navigate to**: http://localhost:3000/minervini-screener
4. **Run screening** with Syariah universe
5. **Check console** for:

**✅ What to look for:**
- Full URLs being called
- HTTP status codes if errors occur
- Error response bodies
- Yahoo Finance data counts (should be ~252+)
- Final screening results (should have some stocks passing)

**❌ What should be gone:**
- Repeated rate limit logs (should only see every 10th)
- Vague error messages
- "insufficient data (170 days)" errors

## Expected Results

### Before Fix
- ❌ 0 stocks passed screening
- ❌ 68/68 stocks skipped (insufficient data)
- ❌ Console flooded with rate limit logs
- ❌ Can't see actual API errors

### After Fix
- ✅ Should see actual API errors (if DataSaham fails)
- ✅ Yahoo Finance returns 252+ days of data
- ✅ Some stocks should pass screening (e.g., 5-15 stocks)
- ✅ Clear, actionable logging

## Possible DataSaham API Issues to Watch For

Based on the improved logging, you might see:

1. **404 - Symbol Not Found**
   ```
   [Datasaham] HTTP 404 - Symbol TLKM not found
   ```
   → Symbol might not be in DataSaham database

2. **401 - Authentication Failed**
   ```
   [Datasaham] HTTP 401 - Invalid API key
   ```
   → API key expired or invalid

3. **422 - Unprocessable Entity**
   ```
   [Datasaham] HTTP 422 - Invalid timeframe parameter
   ```
   → Endpoint format might still be wrong

4. **429 - Rate Limit Exceeded**
   ```
   [Datasaham] Rate limit exceeded. Waiting 15s...
   ```
   → Will auto-wait and retry

5. **500 - Server Error**
   ```
   [Datasaham] HTTP 500 - Internal server error
   ```
   → DataSaham API is having issues

## Next Steps

1. **Test the screening** and share the console output
2. **Check if DataSaham API is failing** (look for HTTP errors)
3. **Verify Yahoo Finance fallback works** (should return 252+ days)
4. **Confirm screening results** (should have stocks passing now)

If DataSaham continues to fail 100%, we should investigate:
- Is the endpoint format correct? (we're using `/latest` now)
- Is the API key valid?
- Are Indonesian stock symbols correct format?
- Does DataSaham API support the `/latest` endpoint?

## Related Files

- `lib/datasaham.ts` - Enhanced error logging and rate limit handling
- `lib/yahooFinance.ts` - Fixed calendar days calculation
- `app/api/minervini-screener/route.ts` - Uses both APIs

---

**Version**: Enhanced Logging v2.0  
**Date**: 2026-02-28  
**Status**: Ready for testing
