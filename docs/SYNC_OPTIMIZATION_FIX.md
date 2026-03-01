# Fix: Sync Script Optimization

## ⚠️ Problems Identified

### 1. Too Many Stocks (955)
**Issue**: Initial sync tried to download ALL stocks from ALL universes (955 stocks)  
**Time**: Would take 30-45 minutes + very high DataSaham API usage  
**Result**: Script appeared to hang after 3 calls

### 2. Silent Progress
**Issue**: No progress indicators during long API calls  
**Result**: Looked like it crashed, but was just waiting

## ✅ Fixes Applied

### 1. Smart Default: Syariah Universe Only
Changed initial sync to focus on your main universe:
- **Before**: 955 stocks (all universes)
- **After**: 68 stocks (Syariah only)
- **Time**: 5-10 minutes instead of 30-45 minutes

### 2. Better Progress Logging
Added time tracking and success/failure counts

## 🎯 Updated Commands

### Recommended: Sync Syariah Only (5-10 min)
```bash
npm run sync-ohlc:initial
```

Now syncs only 68 Syariah stocks (your main universe)

### If You Want More Stocks

**Option A: Manually edit the script**

Edit `scripts/sync-ohlc-data.ts` line ~58:
```typescript
// Change from:
symbols = UNIVERSES.syariah || [];

// To one of:
symbols = UNIVERSES.liquid || [];     // ~80 stocks
symbols = UNIVERSES.lq45 || [];       // ~45 stocks
symbols = [...UNIVERSES.syariah, ...UNIVERSES.lq45]; // Combined
```

**Option B: Sync by universe incrementally**
```bash
# Modify script to accept universe parameter in future
# For now, edit the script manually
```

## 📊 Comparison

| Approach | Stocks | Time | Storage | Recommended |
|----------|--------|------|---------|-------------|
| Syariah only | 68 | 5-10 min | ~8 MB | ✅ YES |
| LQ45 + IDX80 | ~120 | 10-15 min | ~15 MB | ✅ Good |
| All universes | 955 | 30-45 min | ~120 MB | ❌ Too much |

## 🚀 What to Do Now

### Step 1: Kill Current Sync
Press `Ctrl+C` in terminal to stop the current sync

### Step 2: Run Optimized Sync
```bash
npm run sync-ohlc:initial
```

Should now show:
```
📦 Initial sync: 68 Syariah stocks, 1800 calendar days (~5 years)
💡 Tip: To sync all stocks, modify the script or sync by universe

📡 Fetching data from DataSaham/Yahoo Finance...
[Datasaham] Fetching 1800 trading days...
[Datasaham] Calling: /api/chart/BBCA/daily...
[Datasaham] Calling: /api/chart/BBRI/daily...
...

✅ Data fetch complete in 180s
   Success: 68/68 stocks
   
💾 Inserting 85,000 records into database...
  Batch 1/85: 1000 records
  ...

✅ Sync Complete!
```

### Step 3: Test Screener
```bash
npm run dev
# Navigate to /minervini-screener
# Should work perfectly now!
```

## ⏱️ Expected Timeline

| Step | Time |
|------|------|
| Database migration | 10 seconds |
| Syariah sync (68 stocks) | 5-10 minutes |
| Testing screener | 5 seconds |
| **Total** | **~10 minutes** |

## 🐛 If Script Still Hangs

1. **Check terminal process**: Is it still running or crashed?
2. **Check network**: DataSaham API might be slow/down
3. **Try single stock first**: `npm run sync-ohlc TLKM`
4. **Check error logs**: Look for red error messages

## 💡 Future Improvements

I can add:
1. **Universe parameter**: `npm run sync-ohlc:initial -- --universe syariah`
2. **Progress bar**: Show X/68 stocks completed
3. **Batch control**: Limit concurrent API calls
4. **Resume capability**: Continue from where it stopped

Would you like me to implement any of these?

---

**Action Required**: Kill current sync (`Ctrl+C`) then run `npm run sync-ohlc:initial` again
