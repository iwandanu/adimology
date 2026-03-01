# Quick Database Debug

## Check What Symbols Exist

Run this in Supabase SQL Editor:

```sql
-- See what symbols are in the database
SELECT DISTINCT symbol, COUNT(*) as record_count
FROM ohlc_historical_data
GROUP BY symbol
ORDER BY symbol
LIMIT 20;
```

This will show:
- What stock symbols are actually stored
- How many records each has

## Expected vs Actual

**Expecting (from Syariah universe):**
- TLKM, ASII, UNVR, ICBP, INDF, etc.

**Check if they match what's in database!**

## Quick Fix Test

Try this in Supabase SQL Editor to check case sensitivity:

```sql
-- Test query (replace 'TLKM' with any symbol from screenshot)
SELECT symbol, COUNT(*) 
FROM ohlc_historical_data 
WHERE symbol = 'TLKM'
GROUP BY symbol;

-- Also try
SELECT symbol, COUNT(*) 
FROM ohlc_historical_data 
WHERE symbol ILIKE 'TLKM'
GROUP BY symbol;
```

If the second query returns results but first doesn't, we have a case sensitivity issue!
