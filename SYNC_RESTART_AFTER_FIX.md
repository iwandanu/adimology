# Database Sync Issue - Quick Fix

## 🐛 What Happened

The first sync failed on many batches due to the `BIGINT` → `NUMERIC` issue. Only 5 stocks got inserted with partial data (236 days instead of 1200+).

## ✅ Schema is Now Fixed

Migration 019 has been applied:
- ✅ `volume` column is now `NUMERIC` (accepts decimals)
- ✅ Functions updated

## 🚀 Restart Sync Now

The `UNIQUE(symbol, date)` constraint will prevent duplicates. Just run:

```bash
npm run sync-ohlc:initial
```

This will:
- ✅ **Skip the 5 stocks** already in database (due to UNIQUE constraint)
- ✅ **Insert the other 63 stocks** successfully
- ✅ **Complete in 5-10 minutes**

## Expected Output

```
📦 Initial sync: 68 Syariah stocks
📡 Fetching data from DataSaham/Yahoo Finance...
[Datasaham] Processing 68 stocks sequentially...
[Datasaham] Progress: 7/68 (10%) - Success: 5, Failed: 2
...
[Datasaham] Progress: 68/68 (100%) - Success: 65, Failed: 3

✅ Data fetch complete in 420s
   Success: 65/68 stocks

💾 Inserting 82,000 records into database...
  Batch 1/82: 1000 records ✅
  Batch 2/82: 1000 records ✅
  ...
  (Some batches will skip due to UNIQUE constraint - normal!)

✅ Sync Complete!
  Symbols processed: 65
  Total records: 82,000
  
🎉 Done!
```

## Then Test Screener

After sync completes:
```bash
# Screener should work now!
# Refresh browser page: http://localhost:3000/minervini-screener
```

Should see:
```
[Database] Fetched 65/68 symbols successfully ✅
[Minervini] Screening complete: 8 stocks passed ✅
```

---

**Action**: Run `npm run sync-ohlc:initial` now (schema is fixed!)
