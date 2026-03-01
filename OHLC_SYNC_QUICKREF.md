# OHLC Sync - Quick Reference

## ✅ What's Set Up

**Netlify Scheduled Function**: `ohlc-sync-daily.ts`  
**Schedule**: Daily at **07:00 WIB** (00:00 UTC)  
**Action**: Syncs last 7 days of OHLC data for all stocks

## 📅 Current Schedules

| Function | Time (WIB) | Frequency |
|----------|------------|-----------|
| **OHLC Sync** | 07:00 | Daily |
| Minervini Screener | 08:00, 16:00 | Twice daily |
| Watchlist Analysis | 18:00 | Daily |

## 🔧 How to Change Schedule

### Edit `netlify.toml`:
```toml
[functions."ohlc-sync-daily"]
  schedule = "0 0 * * *"  # Change this line
```

### Common Schedules:
```bash
# Daily at 6am WIB (before market)
schedule = "0 23 * * *"  # 23:00 UTC = 06:00 WIB

# Daily at 8am WIB (after market opens)
schedule = "0 1 * * *"   # 01:00 UTC = 08:00 WIB

# Twice daily: 7am and 7pm WIB
schedule = "0 0,12 * * *"

# Weekdays only (Mon-Fri)
schedule = "0 0 * * 1-5"

# Every 6 hours
schedule = "0 */6 * * *"
```

## 🚀 Manual Trigger

### Via Terminal:
```bash
# Using Netlify CLI
netlify functions:invoke ohlc-sync-daily

# Via curl
curl -X POST https://adimology.netlify.app/.netlify/functions/ohlc-sync-daily
```

### Via Browser:
Navigate to: https://adimology.netlify.app/.netlify/functions/ohlc-sync-daily

## 📊 Monitoring

### Netlify Dashboard:
https://app.netlify.com → Functions → Scheduled Functions → `ohlc-sync-daily`

### Check Logs:
```sql
-- In Supabase SQL Editor
SELECT * FROM background_job_logs 
WHERE job_type = 'ohlc-sync' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Expected Output:
```
✅ Job completed in 57s
   Symbols synced: 950/955
   Records inserted: 6,650
   Status: completed
```

## 🎯 What It Does

1. ✅ Fetches last **7 days** of OHLC data
2. ✅ Syncs **~950 stocks** from all universes
3. ✅ Upserts **~6,500 records** to database
4. ✅ Logs job status in `background_job_logs`
5. ✅ Runs in **~60 seconds**

## 🆘 Troubleshooting

### Function not running?
- Check Netlify dashboard for errors
- Verify environment variables are set
- Check function logs for details

### Taking too long?
- Normal runtime: 45-90 seconds
- API rate limiting may cause delays
- Function auto-retries failed stocks

### Data not updating?
- Check last job status in `background_job_logs`
- Manually trigger function to test
- Verify API keys are valid

## 📚 Full Documentation

See: `docs/OHLC_SYNC_SCHEDULED.md` for complete guide

## 🎉 Benefits

✅ **Zero manual work** - Runs automatically every morning  
✅ **Always fresh data** - Minervini screener uses latest prices  
✅ **Reliable** - Cloud-based with 99.9% uptime  
✅ **Free** - Within Netlify free tier (30 runs/month)  
✅ **Monitored** - Full logging in Netlify + Supabase  

---

**Next Deploy**: Function will be active after your next Netlify build completes! 🚀
