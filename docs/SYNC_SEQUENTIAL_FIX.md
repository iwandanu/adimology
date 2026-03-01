# Fix: Sequential API Calls with Progress & Timeout

## ⚠️ Problem: Hanging After 3 Calls

**Root Cause**: DataSaham API calls were hanging/timing out with no feedback
- No timeout handling (calls could hang forever)
- No progress indicators (looked frozen)
- No error recovery (one bad call could stop everything)

## ✅ Solutions Applied

### 1. Added 30-Second Timeout
Prevents any single API call from hanging forever:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
```

**Result**: If API doesn't respond in 30s, automatically falls back to Yahoo Finance

### 2. Progress Logging Every 10%
Shows real-time progress:
```
[Datasaham] Progress: 7/68 (10%) - Success: 5, Failed: 2
[Datasaham] Progress: 14/68 (21%) - Success: 12, Failed: 2
[Datasaham] Progress: 21/68 (31%) - Success: 18, Failed: 3
...
```

**Result**: You can see it's actually working, not frozen

### 3. Better Error Handling
Wrapped each API call in try-catch:
- Logs specific errors
- Automatically tries Yahoo Finance
- Continues with next stock
- Never stops the entire sync

### 4. Detailed First 5 Stocks
Shows what's happening:
```
[Datasaham] [1] Fetching TLKM...
[Datasaham] [1] TLKM - Success: 1247 days
[Datasaham] [2] Fetching ASII...
[Datasaham] [2] ASII - DataSaham failed, trying Yahoo...
[Datasaham] [2] ASII - Yahoo success: 1253 days
```

## 🎯 Expected Behavior Now

### Console Output
```
🔄 OHLC Data Sync Started
Mode: initial
📦 Initial sync: 68 Syariah stocks, 1800 calendar days (~5 years)

📡 Fetching data from DataSaham/Yahoo Finance...
[Datasaham] Fetching 1800 trading days (2019-01-07 to 2026-03-01, 2610 calendar days)
[Datasaham] Processing 68 stocks sequentially...

[Datasaham] [1] Fetching TLKM...
[Datasaham] [1] TLKM - Success: 1247 days ✅
[Datasaham] [2] Fetching ASII...
[Datasaham] [2] ASII - Success: 1253 days ✅
[Datasaham] [3] Fetching UNVR...
[Datasaham] [3] UNVR - Success: 1249 days ✅
...

[Datasaham] Progress: 7/68 (10%) - Success: 5, Failed: 2
[Datasaham] Progress: 14/68 (21%) - Success: 12, Failed: 2
...

✅ Data fetch complete in 420s
   Success: 65/68 stocks
   Failed: 3 stocks
   
💾 Inserting 82,000 records into database...
  Batch 1/82: 1000 records
  ...

✅ Sync Complete!
🎉 Done!
```

### Timing
- **Per stock**: 5-10 seconds (API call + fallback if needed)
- **68 stocks**: 5-10 minutes total
- **With progress updates**: You'll see it's working!

## 🚀 Run It Now

```bash
# Kill old process (Ctrl+C)
# Run new version with fixes
npm run sync-ohlc:initial
```

You should now see:
1. ✅ Progress updates every 7 stocks (10%)
2. ✅ Detailed logging for first 5 stocks
3. ✅ No hanging (30s timeout per stock)
4. ✅ Automatic Yahoo fallback
5. ✅ Completes in 5-10 minutes

## 📊 Success Metrics

After completion:
- **Target**: 68 stocks
- **Expected success**: 60-68 stocks (some may be delisted)
- **Database records**: ~80,000-85,000
- **Storage**: ~8 MB

## 🐛 If Still Having Issues

### Check 1: Is DataSaham API Down?
If you see many failures like:
```
[Datasaham] [1] TLKM - DataSaham failed, trying Yahoo...
[Datasaham] [1] TLKM - Yahoo success: 1247 days
```

→ **This is OK!** Yahoo fallback is working

### Check 2: All Stocks Timing Out?
If every stock hits 30s timeout:
```
[Datasaham] Fetch error for https://api.datasaham.io/...
```

→ DataSaham API might be down. Script will use Yahoo for all stocks.

### Check 3: Process Crashes?
If script exits with error:
→ Share the error message so I can fix it

## 💡 Alternative: Use Yahoo Only

If DataSaham is consistently slow/down, you can temporarily disable it:

Edit `.env.local`:
```bash
# Comment out DataSaham key to force Yahoo fallback
# DATASAHAM_API_KEY=sbk_...
```

Then run sync - will use Yahoo Finance for everything (slower but reliable).

---

**Status**: ✅ Fixed with timeout, progress logging, and error recovery  
**Action**: Run `npm run sync-ohlc:initial` - should complete in 5-10 min
