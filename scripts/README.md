# Utility Scripts

This directory contains helper scripts for maintaining the application.

## Available Scripts

### fetch-sectors.js

Fetches sector data from Stockbit API for manual sector mapping updates.

**Usage:**
```bash
# Fetch all syariah stocks (default)
node scripts/fetch-sectors.js

# Fetch specific stocks
node scripts/fetch-sectors.js TLKM ASII BBCA

# Fetch with custom list
node scripts/fetch-sectors.js ABCD EFGH IJKL MNOP
```

**Requirements:**
- Node.js 18+ with ES modules support
- `STOCKBIT_JWT_TOKEN` environment variable in `.env.local`

**Output:**
- Sector distribution statistics
- TypeScript code snippet ready to copy into `lib/sectorMapping.ts`

**Example:**
```bash
$ node scripts/fetch-sectors.js TLKM ASII

🔍 Fetching sector data for 2 stocks...

[1/2] TLKM    ✓ Infrastructure
[2/2] ASII    ✓ Consumer Cyclicals

================================================================================
📊 SECTOR DISTRIBUTION
================================================================================
Infrastructure                            1 stocks
Consumer Cyclicals                        1 stocks

================================================================================
📝 TYPESCRIPT MAPPING (Copy to sectorMapping.ts)
================================================================================
export const STOCK_SECTOR_MAP: Record<string, string> = {
  // Consumer Cyclicals
  'ASII': IDXSector.CONSUMER_CYCLICALS, // Consumer Cyclicals

  // Infrastructure
  'TLKM': IDXSector.INFRASTRUCTURE, // Infrastructure

};

================================================================================
✅ Done! Update the mapping in lib/sectorMapping.ts
================================================================================
```

## Adding New Scripts

When adding new scripts:

1. Create the script file in this directory
2. Add execute permissions (Unix/Mac): `chmod +x scripts/your-script.js`
3. Add documentation to this README
4. Use ES modules (not CommonJS)
5. Include usage examples
6. Handle errors gracefully

## Notes

- All scripts use ES modules (`import`/`export`)
- Rate limiting is built-in for API calls (500ms delay)
- Scripts read from `.env.local` automatically via `dotenv/config`
