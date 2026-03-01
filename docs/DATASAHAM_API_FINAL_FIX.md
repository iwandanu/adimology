# DataSaham API - Final Fix Based on API Documentation Test

## Issue Discovered

From the screenshot of the DataSaham API documentation test, we discovered the **root cause** of the 100% failure rate:

### ❌ What We Were Using (WRONG)
```
GET /api/chart/TLKM/daily/latest?limit=252
```
This endpoint **doesn't exist or doesn't work** as expected!

### ✅ What Actually Works (CORRECT)
```
GET /api/chart/TLKM/daily?from=2026-02-10&to=2026-02-18&limit=0
```

## API Documentation Evidence

From the screenshot:
- **URL**: `https://api.datasaham.io/api/chart/{symbol}/{timeframe}`
- **Method**: `GET`
- **Required Parameters**:
  - `symbol`: Stock symbol (e.g., `TLKM`) - WITHOUT `.JK`
  - `timeframe`: Chart period (e.g., `daily`, `1m`, `5m`, `15m`, `30m`, `1h`, etc.)
  - `from`: Start date in `YYYY-MM-DD` format (required)
  - `to`: End date in `YYYY-MM-DD` format (required)
  - `limit`: Number of records (optional, `0` = no limit)

## Response Structure

The API returns nested structure:
```json
{
  "success": true,
  "data": {
    "message": "Successfully Get Daily Price Data",
    "data": {
      "chartbit": [
        {
          "date": "2026-02-18",
          "unixdate": 1771367680,
          "open": 3470,
          "high": 3510,
          "low": 3460,
          "close": 3470,
          "volume": 827978080,
          "foreignbuy": 221432165809,
          "foreignsell": 196783093080,
          "frequency": 13205,
          "foreignflow": -122158905794484,
          "soxclose": 3457271359346080,
          "dividend": 0,
          "value": 288422987600,
          "shareoutstanding": 99002216400,
          "freq_analyzer": 35.95831980419712
        }
      ]
    }
  }
}
```

**Path to candles**: `response.data.data.chartbit`

## Changes Made

### 1. Fixed Endpoint (lib/datasaham.ts)

**Before:**
```typescript
const endpoint = `/api/chart/${cleanSymbol}/daily/latest`;
const raw = await fetchDatasaham<unknown>(endpoint, { limit: 252 });
```

**After:**
```typescript
// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - daysBack);

const fromDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
const toDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD

const endpoint = `/api/chart/${cleanSymbol}/daily`;
const raw = await fetchDatasaham<unknown>(endpoint, { 
  from: fromDate,
  to: toDate,
  limit: 0 // 0 = no limit, get all data in range
});
```

### 2. Enhanced Response Parsing (extractCandles function)

Added explicit handling for DataSaham's nested structure:

```typescript
function extractCandles(raw: unknown): UnknownRecord[] {
  // ... existing checks ...
  
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
    
    // Fallback: search all values...
  }
}
```

### 3. Updated Logging

**Before:**
```
[Datasaham] Calling: /api/chart/TLKM/daily/latest?limit=252
```

**After:**
```
[Datasaham] Fetching historical data for 68 stocks (2025-10-02 to 2026-02-28)
[Datasaham] Calling: /api/chart/TLKM/daily?from=2025-10-02&to=2026-02-28
```

## Expected Results After Fix

### Console Output (Success Case)
```
[Datasaham] Fetching historical data for 68 stocks (2025-10-02 to 2026-02-28)
[Datasaham] Calling: /api/chart/TLKM/daily?from=2025-10-02&to=2026-02-28
[Datasaham] Calling: /api/chart/ASII/daily?from=2025-10-02&to=2026-02-28
[Datasaham] Calling: /api/chart/UNVR/daily?from=2025-10-02&to=2026-02-28
[Datasaham] Rate limit: 90/100 remaining
[Datasaham] Rate limit: 80/100 remaining
[Minervini] Fetched OHLC data for 68 stocks
[Minervini] Building sector map from static data...
[Minervini] Built sector map with 68 entries (0 unknown)
[Minervini] Calculated sector returns for 10 sectors
[Minervini] Screening complete: 8 stocks passed with score >= 6
```

### Key Improvements

1. ✅ **Correct endpoint format** (using `from`/`to` instead of `/latest`)
2. ✅ **Proper date range calculation** (YYYY-MM-DD format)
3. ✅ **Enhanced response parsing** (handles nested `chartbit` array)
4. ✅ **Better logging** (shows actual date range)
5. ✅ **Should eliminate 422/404 errors** from DataSaham

## Testing Checklist

When you run the screener now:

- [ ] No more HTTP 404/422 errors from DataSaham
- [ ] Should see: `[Datasaham] Calling: /api/chart/TLKM/daily?from=...&to=...`
- [ ] DataSaham success rate should be 90%+ (not 0%)
- [ ] Yahoo Finance fallback only for specific stocks (not all 68)
- [ ] Should see stocks passing Minervini criteria (5-15 stocks)
- [ ] No "insufficient data" errors

## API Parameters Summary

| Parameter | Value | Required | Description |
|-----------|-------|----------|-------------|
| `symbol` | `TLKM` (no .JK) | ✅ Yes | Stock symbol |
| `timeframe` | `daily` | ✅ Yes | Chart period |
| `from` | `2025-10-02` | ✅ Yes | Start date (YYYY-MM-DD) |
| `to` | `2026-02-28` | ✅ Yes | End date (YYYY-MM-DD) |
| `limit` | `0` | ❌ Optional | 0 = no limit |

## Date Range Calculation

For 252 trading days (1 year):
```typescript
const endDate = new Date();              // Today: 2026-02-28
const startDate = new Date();
startDate.setDate(startDate.getDate() - 252); // 252 days ago: 2025-06-21

// But we're requesting calendar days, so DataSaham returns all trading days in range
// The actual number of trading days will be ~180-190 (weekends excluded)
```

Note: DataSaham API filters out weekends automatically, so requesting 252 calendar days will return ~180 trading days. For Minervini analysis which needs 252 trading days, we should request ~365 calendar days.

## Adjustment Needed

Let me fix the date calculation to request more days:

```typescript
// For 252 trading days, we need ~365 calendar days
// (252 trading days ≈ 1 year of market data)
const startDate = new Date();
startDate.setDate(startDate.getDate() - Math.ceil(daysBack * 1.45)); // Add 45% buffer
```

This ensures we get enough trading days even after weekends/holidays are filtered out.

## Final Status

- ✅ Endpoint format corrected
- ✅ Required parameters added (`from`, `to`)
- ✅ Response parsing enhanced for nested structure
- ✅ Logging improved for debugging
- ⚠️ Date range may need adjustment (see note above)

---

**Based on**: Screenshot of DataSaham API documentation test  
**Date**: 2026-02-28  
**Status**: Ready for testing
