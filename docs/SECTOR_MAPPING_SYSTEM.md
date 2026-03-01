# Sector Mapping System

## Overview

To reduce API load on the unofficial Stockbit API, we've implemented a **static sector mapping database** that stores sector classifications for all stocks in our universes.

## Architecture

### Files Created

1. **`lib/sectorMapping.ts`** - Static sector database with 80+ stock mappings
2. **`lib/UPDATE_SECTORS_GUIDE.md`** - Comprehensive update guide
3. **`scripts/fetch-sectors.js`** - Helper script to fetch sector data from Stockbit
4. **`scripts/README.md`** - Scripts documentation

### How It Works

```
┌─────────────────────────────────────────┐
│   Minervini Screener API Request        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   buildSectorMapFromStatic()            │
│   • No API calls                        │
│   • Instant lookup                      │
│   • Uses static mapping                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   getSectorForStock()                   │
│   • Returns sector from static map      │
│   • O(1) lookup time                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Relative Strength Calculation         │
│   • Groups stocks by sector             │
│   • Calculates percentile rank          │
└─────────────────────────────────────────┘
```

**Before (Old Approach):**
- 70 API calls to Stockbit for syariah universe
- Each call: ~500ms delay (rate limiting)
- Total time: ~35 seconds just for sectors
- Risk of hitting API rate limits

**After (New Approach):**
- 0 API calls during screening
- Instant sector lookup from memory
- Total time: <100ms for sector mapping
- No risk of rate limits

## Benefits

1. **Performance**: Screening is 30-40 seconds faster
2. **Reliability**: No dependency on Stockbit API availability
3. **Cost**: Reduced API load (being nice to unofficial API)
4. **Maintainability**: Easy to update once a month

## Sector Categories (IDX Standard)

The system uses official IDX sector classifications:

- **Basic Materials** (23 stocks) - Mining, metals, cement, chemicals, plantation
- **Consumer Cyclicals** (5 stocks) - Automotive, retail, leisure
- **Consumer Non-Cyclicals** (12 stocks) - Food & beverage, personal care, tobacco
- **Energy** (4 stocks) - Oil, gas, coal trading
- **Healthcare** (2 stocks) - Pharmaceuticals, hospitals
- **Industrials** (3 stocks) - Conglomerates, manufacturing
- **Infrastructure** (12 stocks) - Telecommunications, toll roads, construction
- **Properties & Real Estate** (4 stocks) - Property developers, REITs
- **Technology** (2 stocks) - IT services, media
- **Transportation & Logistics** (2 stocks) - Airlines, shipping, logistics

## Update Process

### Monthly Maintenance (5 minutes)

1. **Check for missing mappings**
   ```bash
   # Run the screener and check logs
   npm run dev
   # Navigate to /minervini-screener
   # Look for: [Minervini] Missing sector mappings for: ...
   ```

2. **Fetch new sector data** (if needed)
   ```bash
   node scripts/fetch-sectors.js NEWSTOCK1 NEWSTOCK2
   ```

3. **Update the mapping file**
   - Copy output from script to `lib/sectorMapping.ts`
   - Update version and date

4. **Test**
   ```bash
   # Run screener again to verify
   npm run dev
   ```

### When to Update

- **Monthly**: First week of each month (recommended)
- **On-demand**: When adding new stocks to universe
- **Emergency**: When logs show missing mappings

## API Usage Comparison

### Scenario: Screening 70 Syariah Stocks

| Metric | Old (Stockbit API) | New (Static) | Improvement |
|--------|-------------------|--------------|-------------|
| API Calls | 70 | 0 | 100% reduction |
| Time | ~35 seconds | <0.1 seconds | 99.7% faster |
| Rate Limit Risk | High | None | ✓ |
| Reliability | Depends on API | Always works | ✓ |
| Maintenance | Real-time | Monthly | Trade-off |

## Helper Functions

The `sectorMapping.ts` provides utility functions:

```typescript
// Get sector for a stock
getSectorForStock('TLKM') // → 'Infrastructure'

// Get all stocks in a sector
getStocksInSector('Infrastructure') // → ['TLKM', 'EXCL', 'TOWR', ...]

// Check if stock has mapping
hasSectorMapping('TLKM') // → true

// Find missing mappings in a list
getMissingSectorMappings(['TLKM', 'NEWSTOCK']) // → ['NEWSTOCK']

// Get sector statistics
getSectorStatistics() // → { 'Basic Materials': 23, ... }

// Get all unique sectors
getAllSectors() // → ['Basic Materials', 'Consumer Cyclicals', ...]
```

## Monitoring

The system automatically logs warnings for missing mappings:

```
[Minervini] Missing sector mappings for: NEWSTOCK, ANOTHER
```

This helps you identify when updates are needed.

## Fallback Strategy

If a stock is not found in the mapping:
- Returns `'Unknown'` as sector
- Still included in screening
- Grouped with other 'Unknown' stocks for RS calculation
- Logged as warning for future update

## Version Control

The mapping file includes version tracking:

```typescript
export const SECTOR_VERSION = '1.0.0';
export const LAST_UPDATED = '2026-02-28';
```

Increment version when making updates:
- **Major** (1.x.x): Complete rebuild or restructuring
- **Minor** (x.1.x): Adding 5+ new stocks or sector changes
- **Patch** (x.x.1): Small fixes or 1-4 stock additions

## Future Improvements

Potential enhancements:
1. **Auto-sync**: Script to auto-update from Stockbit monthly (with user approval)
2. **Subsector support**: Add detailed subsector classifications
3. **Historical tracking**: Track sector changes over time
4. **Validation**: Compare with IDX official data
5. **Multi-source**: Combine data from multiple sources for accuracy

## Conclusion

The static sector mapping system provides a pragmatic solution that:
- Respects the unofficial Stockbit API (reduced load)
- Improves screening performance significantly
- Maintains accuracy with minimal monthly maintenance
- Provides clear update workflows and documentation

**Trade-off**: We exchange real-time sector data for near-instant performance. Since sector classifications rarely change (maybe 1-2 times per year per stock), monthly updates are sufficient for our use case.
