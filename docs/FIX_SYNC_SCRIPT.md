# Fix: Environment Variables Error

## Problem
The sync script can't find environment variables because it's running outside Next.js context.

## Solution Applied ✅

I've fixed the script to load `.env.local` properly:

```typescript
// Now included in scripts/sync-ohlc-data.ts:
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });
```

## Steps to Run Successfully

### 1. Run Migration First
```bash
npm run migrate
```

**What this does:**
- Creates `ohlc_historical_data` table
- Creates indexes and helper functions
- Sets up migration tracking

**If it's your first time:**
- Script will show SQL to run in Supabase SQL Editor
- Copy the SQL → Open Supabase Dashboard → SQL Editor → Paste → Run
- Press ENTER in terminal to continue

### 2. Now Run Initial Sync
```bash
npm run sync-ohlc -- --initial
```

**Expected output:**
```
🔄 OHLC Data Sync Started
Mode: initial
📦 Initial sync: 200 symbols, 1800 calendar days (~5 years)

📡 Fetching data from DataSaham/Yahoo Finance...
[Datasaham] Fetching 252 trading days...
✅ Fetched data for 198/200 symbols
  TLKM: 1247 days
  ASII: 1253 days
  ...

💾 Inserting 248,000 records into database...
  Batch 1/248: 1000 records
  ...

✅ Sync Complete!
```

### 3. Test Screener
```bash
npm run dev
# Navigate to /minervini-screener
```

**Should now show:**
```
[Minervini] Data source: Database ✅
[Database] Fetched 68/68 symbols successfully ✅
[Minervini] Screening complete: 8 stocks passed ✅
```

## Troubleshooting

### Error: "supabaseUrl is required"
✅ **Fixed!** Script now loads `.env.local` properly

### Error: "Could not find the table 'public.ohlc_historical_data'"
❌ **You need to run migration first**
```bash
npm run migrate
```

### Sync takes too long
- Normal! Initial sync takes 10-15 minutes
- Downloads ~5 years of data for all stocks
- Only needed once

### Want to test with fewer stocks first?
```bash
# Sync just one stock to test
npm run sync-ohlc -- --symbol TLKM

# Then check if it worked
# Navigate to Supabase Dashboard → Table Editor → ohlc_historical_data
# Should see ~1200+ rows for TLKM
```

## Quick Test Sequence

```bash
# 1. Migration
npm run migrate

# 2. Test with single stock (fast, ~30 seconds)
npm run sync-ohlc -- --symbol TLKM

# 3. Check Supabase (should see data for TLKM)

# 4. Test screener
npm run dev
# Visit /minervini-screener
# Should work if database has data

# 5. Full sync (when ready, ~10-15 min)
npm run sync-ohlc -- --initial
```

---

**Status**: ✅ Script fixed, ready to use!
