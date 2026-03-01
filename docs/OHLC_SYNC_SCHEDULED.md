# OHLC Data Sync - Netlify Scheduled Function

## Overview

Automated daily synchronization of historical OHLC data to Supabase database using Netlify Scheduled Functions (cron jobs).

## Schedule

The OHLC sync runs automatically every day at:
- **07:00 WIB (00:00 UTC)** - Before market opens

## What It Does

1. **Fetches latest data** for all stocks across all universes (LQ45, IDX80, Syariah, etc.)
2. **Syncs last 7 days** of OHLC data to ensure fresh data for screening
3. **Upserts to database** - Updates existing records, inserts new ones
4. **Logs job status** - Tracks success/failure in `background_job_logs` table

## Files

### Function Definition
```
netlify/functions/ohlc-sync-daily.ts
```

### Schedule Configuration
```toml
# netlify.toml
[functions."ohlc-sync-daily"]
  schedule = "0 0 * * *"  # Daily at 00:00 UTC (07:00 WIB)
```

## Cron Schedule Syntax

Netlify uses standard cron syntax:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Examples

| Schedule | Cron | Description |
|----------|------|-------------|
| Daily 7am WIB | `0 0 * * *` | 00:00 UTC = 07:00 WIB |
| Daily 8am WIB | `0 1 * * *` | 01:00 UTC = 08:00 WIB |
| Twice daily | `0 0,12 * * *` | 00:00 and 12:00 UTC |
| Weekdays only | `0 0 * * 1-5` | Mon-Fri at 00:00 UTC |
| Every 6 hours | `0 */6 * * *` | 00:00, 06:00, 12:00, 18:00 UTC |

### Current Schedules

| Function | Schedule | Time (WIB) | Description |
|----------|----------|------------|-------------|
| `ohlc-sync-daily` | `0 0 * * *` | 07:00 | Sync OHLC data daily |
| `minervini-screener-scheduled` | `0 1,9 * * *` | 08:00, 16:00 | Run Minervini screener |
| `analyze-watchlist` | `0 11 * * *` | 18:00 | Analyze watchlist stocks |

## How to Change Schedule

1. **Edit `netlify.toml`**
   ```toml
   [functions."ohlc-sync-daily"]
     schedule = "0 23 * * *"  # Change to 23:00 UTC (06:00 WIB next day)
   ```

2. **Commit and push**
   ```bash
   git add netlify.toml
   git commit -m "chore: adjust OHLC sync schedule"
   git push
   ```

3. **Verify in Netlify Dashboard**
   - Go to: https://app.netlify.com/sites/YOUR_SITE/functions
   - Check "Scheduled Functions" tab
   - Verify new schedule appears

## Manual Trigger

You can manually trigger the sync function via Netlify CLI or API:

### Via Netlify CLI
```bash
netlify functions:invoke ohlc-sync-daily
```

### Via HTTP (Netlify Function URL)
```bash
curl -X POST https://YOUR_SITE.netlify.app/.netlify/functions/ohlc-sync-daily
```

## Monitoring

### Check Logs
1. **Netlify Dashboard**: 
   - Functions → `ohlc-sync-daily` → Logs
   - Shows execution history, runtime, errors

2. **Supabase Dashboard**:
   - Query `background_job_logs` table
   ```sql
   SELECT * FROM background_job_logs 
   WHERE job_type = 'ohlc-sync' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Function Logs Output**:
   ```
   [OHLC Sync] Starting scheduled OHLC data sync...
   [OHLC Sync] Syncing 955 symbols, last 7 days
   [OHLC Sync] Data fetch complete in 45s
   [OHLC Sync] Success: 950/955 stocks
   [OHLC Sync] Total records to upsert: 6650
   [OHLC Sync] Database insertion complete in 12s
   [OHLC Sync] Job completed in 57s
   ```

### Success Metrics
- **Symbols synced**: ~950/955 (99%+)
- **Records inserted**: ~6,500-7,000 (7 days × ~950 stocks)
- **Execution time**: 45-90 seconds
- **Status**: `completed` in job logs

### Common Issues

#### Issue: Function timeout (10s default)
**Solution**: Netlify automatically extends timeout for scheduled functions (up to 15 minutes)

#### Issue: API rate limiting
**Solution**: Function implements rate limit detection and backoff (built into `fetchDatasahamHistoricalMap`)

#### Issue: Missing environment variables
**Solution**: Ensure these are set in Netlify Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATASAHAM_API_KEY` (or `OHLC_DEV_API_KEY`)

## Benefits Over Manual Sync

| Aspect | Manual `npm run sync-ohlc:update` | Automated Netlify Function |
|--------|-----------------------------------|----------------------------|
| **Automation** | Manual execution required | Runs automatically daily |
| **Environment** | Local machine | Cloud serverless |
| **Reliability** | Depends on local uptime | 99.9% uptime guaranteed |
| **Logging** | Terminal output only | Persistent logs + database |
| **Cost** | Free (uses local resources) | Free (within Netlify limits) |
| **Speed** | ~60-90s | ~45-60s (optimized) |

## Netlify Limits

- **Scheduled functions**: Up to 1,000 executions per month (free tier)
- **Function runtime**: 15 minutes max
- **Build minutes**: 300 minutes/month (free tier)

Since we run once daily:
- **Monthly executions**: 30 (well within limit)
- **Typical runtime**: ~60s per execution

## Advanced Configuration

### Sync Multiple Times Per Day
```toml
[functions."ohlc-sync-daily"]
  schedule = "0 0,12 * * *"  # Twice daily: 07:00 and 19:00 WIB
```

### Sync Only Weekdays
```toml
[functions."ohlc-sync-daily"]
  schedule = "0 0 * * 1-5"  # Mon-Fri only
```

### Adjust Days Back
Edit `netlify/functions/ohlc-sync-daily.ts`:
```typescript
const daysBack = 14; // Change from 7 to 14 days
```

## Testing Locally

You can test the function locally using Netlify CLI:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Run function locally**
   ```bash
   netlify functions:serve
   # Then trigger: curl -X POST http://localhost:9999/.netlify/functions/ohlc-sync-daily
   ```

3. **Or use the script directly**
   ```bash
   npm run sync-ohlc:update
   ```

## Related Documentation

- [Netlify Scheduled Functions Guide](https://docs.netlify.com/functions/scheduled-functions/)
- [OHLC Database Solution](./docs/OHLC_DATABASE_SOLUTION.md)
- [OHLC Sync Final Guide](./OHLC_SYNC_FINAL.md)
- [OHLC Database Quickstart](./OHLC_DATABASE_QUICKSTART.md)

## Summary

✅ **Automated**: Runs daily without manual intervention  
✅ **Reliable**: Cloud-based with persistent logging  
✅ **Efficient**: Syncs only last 7 days to minimize API calls  
✅ **Monitored**: Full logging in Netlify and Supabase  
✅ **Free**: Within Netlify free tier limits  

The OHLC data will always be fresh for your Minervini screener and other features! 🎉
