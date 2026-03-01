# Sector Mapping Update Guide

## Overview
This directory contains static sector mappings for IDX stocks to minimize API calls to Stockbit.

## Files
- `sectorMapping.ts` - Static sector database
- `UPDATE_GUIDE.md` - This file

## Update Frequency
**Recommended**: Monthly (or when significant changes occur)
**Last Updated**: 2026-02-28
**Version**: 1.0.0

## When to Update

Update the sector mappings when:
1. New stocks are added to your universe
2. Companies change sectors (rare, but happens during restructuring)
3. You notice "Unknown" sectors in screening logs
4. Monthly maintenance (first week of each month)

## How to Update

### Option 1: Using Stockbit API (Recommended)

1. **Check for missing mappings** - Look at your screening logs for warnings like:
   ```
   [Minervini] Missing sector mappings for: NEWSTOCK, ANOTHER
   ```

2. **Fetch sector data for missing stocks**:
   - Go to Stockbit website: https://stockbit.com/
   - Search for the stock
   - Note the sector displayed on the company profile
   
   OR use the API:
   ```bash
   curl -X GET "https://exodus.stockbit.com/emitten/TLKM/info" \
     -H "authorization: Bearer YOUR_TOKEN" \
     -H "accept: application/json"
   ```

3. **Update `sectorMapping.ts`**:
   ```typescript
   export const STOCK_SECTOR_MAP: Record<string, string> = {
     // ... existing mappings ...
     'NEWSTOCK': IDXSector.TECHNOLOGY,  // Add new mapping
   };
   ```

4. **Update metadata**:
   ```typescript
   export const SECTOR_VERSION = '1.1.0';  // Increment version
   export const LAST_UPDATED = '2026-03-28';  // Update date
   ```

### Option 2: Bulk Update Script

Create a Node.js script `update-sectors.js`:

```javascript
import { fetchEmitenInfo } from './lib/stockbit.js';
import { UNIVERSES } from './lib/universes.js';

async function updateSectorMappings() {
  const allStocks = UNIVERSES.syariah;
  const mappings = {};
  
  for (const stock of allStocks) {
    try {
      const info = await fetchEmitenInfo(stock);
      mappings[stock] = info.data?.sector || 'Unknown';
      console.log(`${stock}: ${mappings[stock]}`);
      
      // Rate limiting - be nice to the API
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`Failed for ${stock}:`, error.message);
    }
  }
  
  console.log('\n=== Mappings ===');
  console.log(JSON.stringify(mappings, null, 2));
}

updateSectorMappings();
```

Run it:
```bash
node update-sectors.js
```

### Option 3: Manual Reference

Cross-reference with official IDX classifications:
- IDX Website: https://www.idx.co.id/
- Navigate to Company Listings
- Download the latest company directory
- Update sectors based on official classifications

## Sector Categories (IDX Standard)

1. **Basic Materials** - Mining, metals, cement, chemicals, plantation
2. **Consumer Cyclicals** - Automotive, retail, leisure
3. **Consumer Non-Cyclicals** - Food & beverage, personal care, tobacco
4. **Energy** - Oil, gas, coal trading
5. **Financials** - Banks, insurance, securities (NOT in Syariah list)
6. **Healthcare** - Pharmaceuticals, hospitals
7. **Industrials** - Conglomerates, manufacturing
8. **Infrastructure** - Telecommunications, toll roads, construction
9. **Properties & Real Estate** - Property developers, REITs
10. **Technology** - IT services, media
11. **Transportation & Logistics** - Airlines, shipping, logistics

## Validation

After updating, run the screener and check for:
```
[Minervini] Missing sector mappings for: ...
```

If no warnings appear, all stocks have valid sector mappings!

## Best Practices

1. **Always backup** before making changes
2. **Test after updating** by running a screening
3. **Document changes** - add comments for major sector reclassifications
4. **Version control** - commit changes to git with descriptive message
5. **Rate limit** - When using Stockbit API, add 500ms delay between calls

## Example Monthly Update Workflow

```bash
# 1. Check current version
grep "SECTOR_VERSION" lib/sectorMapping.ts

# 2. Run screener to see if any missing
npm run dev
# Navigate to /minervini-screener
# Check console for warnings

# 3. Update mappings in lib/sectorMapping.ts

# 4. Test
# Run screener again

# 5. Commit changes
git add lib/sectorMapping.ts
git commit -m "chore: update sector mappings v1.1.0 - added 3 new stocks"
git push
```

## Troubleshooting

**Q: I see "Unknown" sectors in results**
A: Check the `getMissingSectorMappings()` output in logs and add those stocks to the mapping.

**Q: Stockbit API returns 401**
A: Your token has expired. Update the token in `.env.local`:
```bash
# Get new token from Stockbit website (F12 > Network > Copy JWT)
STOCKBIT_JWT_TOKEN=your_new_token_here
```

**Q: A stock changed sectors**
A: This is rare but happens during corporate restructuring. Update the mapping and document in commit message.

## Contact

For questions or issues, check the main README.md or create an issue on GitHub.
