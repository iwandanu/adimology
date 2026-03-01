# OHLC Database - Quick Start

## TL;DR

Store stock data in database → 10-15x faster screening + always have 252+ days ✅

## Quick Setup (5 minutes)

```bash
# 1. Create database table
npm run migrate

# 2. Download historical data (10-15 min, one-time)
npm run sync-ohlc -- --initial

# 3. Test it
npm run dev
# Navigate to /minervini-screener
# Should see results now!
```

## Daily Maintenance

```bash
# Update latest data (run daily after market close)
npm run sync-ohlc -- --update
```

## Storage Impact

- **Size**: 8.6 MB (Syariah) to 25 MB (all stocks)
- **Your 5GB limit**: Uses **0.17% - 0.5%** ✅
- **Performance**: Negligible impact ✅

## Speed Comparison

| Operation | API | Database | Improvement |
|-----------|-----|----------|-------------|
| Screening 68 stocks | 20-30s | 1-2s | **15x faster** |
| Data fetched | 237 days ❌ | 252+ days ✅ | Always enough |
| API calls | 68 | 0 | No limits |

## Commands

```bash
# Initial download (all stocks, 5 years)
npm run sync-ohlc -- --initial

# Daily update (last 10 days)
npm run sync-ohlc -- --update

# Update specific stock
npm run sync-ohlc -- --symbol TLKM

# View stats in database
SELECT * FROM ohlc_data_stats ORDER BY symbol;
```

## Troubleshooting

**Q: Still shows insufficient data?**
A: Check if sync completed: `SELECT COUNT(*) FROM ohlc_historical_data;`

**Q: Database empty after sync?**
A: Check console for errors, try `--symbol TLKM` first to test

**Q: How often to update?**
A: Daily after market close (5 PM WIB), automated via cron

---

**Full documentation**: `docs/OHLC_DATABASE_SOLUTION.md`
