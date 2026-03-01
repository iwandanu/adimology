#!/usr/bin/env node
/**
 * Helper script to fetch sector data from Stockbit API
 * 
 * Usage:
 *   node scripts/fetch-sectors.js [stock1] [stock2] ...
 * 
 * Examples:
 *   node scripts/fetch-sectors.js TLKM ASII BBCA
 *   node scripts/fetch-sectors.js  # Will fetch all syariah stocks
 * 
 * Requirements:
 *   - STOCKBIT_JWT_TOKEN in .env.local
 *   - Node.js 18+
 */

require('dotenv').config({ path: '.env.local' });

const STOCKBIT_API = 'https://exodus.stockbit.com';
const TOKEN = process.env.STOCKBIT_JWT_TOKEN;
const RATE_LIMIT_MS = 500; // Be nice to the API

// If no arguments, use syariah list
const DEFAULT_STOCKS = [
  'TLKM', 'ASII', 'UNVR', 'ICBP', 'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT',
  'BBRI', 'BMRI', 'BBCA', 'BBNI', 'KLBF', 'SMGR', 'GGRM', 'HMSP', 'JSMR', 'PTBA',
  'WIKA', 'SMRA', 'PGAS', 'TKIM', 'UNTR', 'AKRA', 'MEDC', 'ELSA', 'DOID', 'SRIL',
  'TINS', 'EMTK', 'MNCN', 'APLN', 'BSDE', 'CTRA', 'EXCL', 'TOWR', 'TBIG', 'SCMA',
  'SILO', 'AKSI', 'MRAT', 'ERAA', 'ACES', 'ASSA', 'BREN', 'IMAS', 'AALI', 'LSIP',
  'SGRO', 'SSMS', 'SIMP', 'SMAR', 'PALM', 'JPFA', 'MAIN', 'AGRO', 'BEST', 'TPIA',
  'BRMS', 'HRUM', 'ITMG', 'INTP', 'SMCB', 'MYOR', 'ULTJ', 'AMRT', 'BMTR', 'ADHI',
  'PTRO', 'ESSA', 'TOBA', 'MDKA', 'TAPG', 'KAEF',
];

async function fetchEmitenInfo(symbol) {
  if (!TOKEN) {
    throw new Error('STOCKBIT_JWT_TOKEN not found in environment');
  }

  const url = `${STOCKBIT_API}/emitten/${symbol}/info`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'authorization': `Bearer ${TOKEN}`,
        'accept': 'application/json',
        'user-agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`  Error fetching ${symbol}: ${error.message}`);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const stocks = args.length > 0 ? args : DEFAULT_STOCKS;

  console.log(`🔍 Fetching sector data for ${stocks.length} stocks...\n`);

  const results = [];
  const sectorCounts = {};

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i].toUpperCase();
    process.stdout.write(`[${i + 1}/${stocks.length}] ${stock.padEnd(8)}`);

    const info = await fetchEmitenInfo(stock);

    if (info && info.sector) {
      const sector = info.sector;
      results.push({ stock, sector, name: info.name });
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      console.log(`✓ ${sector}`);
    } else {
      results.push({ stock, sector: 'Unknown', name: 'N/A' });
      console.log(`✗ Unknown`);
    }

    // Rate limiting
    if (i < stocks.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SECTOR DISTRIBUTION');
  console.log('='.repeat(80));
  
  Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sector, count]) => {
      console.log(`${sector.padEnd(40)} ${count.toString().padStart(3)} stocks`);
    });

  console.log('\n' + '='.repeat(80));
  console.log('📝 TYPESCRIPT MAPPING (Copy to sectorMapping.ts)');
  console.log('='.repeat(80));
  console.log('export const STOCK_SECTOR_MAP: Record<string, string> = {');
  
  const groupedBySector = {};
  results.forEach(({ stock, sector }) => {
    if (!groupedBySector[sector]) {
      groupedBySector[sector] = [];
    }
    groupedBySector[sector].push(stock);
  });

  Object.entries(groupedBySector)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([sector, stocks]) => {
      console.log(`  // ${sector}`);
      stocks.forEach(stock => {
        const sectorEnum = sector.replace(/ & /g, '_').replace(/ /g, '_').toUpperCase();
        console.log(`  '${stock}': IDXSector.${sectorEnum}, // ${sector}`);
      });
      console.log('');
    });

  console.log('};');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Done! Update the mapping in lib/sectorMapping.ts');
  console.log('='.repeat(80));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
