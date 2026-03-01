/**
 * OHLC Data Sync Script
 * 
 * Populates and maintains historical OHLC data in Supabase database.
 * Run this script to:
 * - Initial population: Download 5 years of history for all stocks
 * - Daily updates: Refresh latest data (run via cron)
 * 
 * Usage:
 *   npm run sync-ohlc -- --initial     # Full 5-year download
 *   npm run sync-ohlc -- --update      # Update last 7 days
 *   npm run sync-ohlc -- --symbol TLKM # Sync specific stock
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { fetchDatasahamHistoricalMap } from '../lib/datasaham';
import { UNIVERSES } from '../lib/universes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Make sure .env.local file exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface SyncOptions {
  mode: 'initial' | 'update' | 'symbol';
  symbol?: string;
  daysBack?: number;
}

async function syncOHLCData(options: SyncOptions) {
  console.log(`\n🔄 OHLC Data Sync Started`);
  console.log(`Mode: ${options.mode}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  let symbols: string[] = [];
  let daysBack = options.daysBack || 30;

  // Determine which symbols to sync
  switch (options.mode) {
    case 'initial':
      // For initial sync, use syariah universe by default (faster, more relevant)
      // You can change this to sync other universes if needed
      symbols = UNIVERSES.syariah || [];
      daysBack = 1800; // ~5 years (accounts for weekends/holidays)
      console.log(`📦 Initial sync: ${symbols.length} Syariah stocks, ${daysBack} calendar days (~5 years)`);
      console.log(`💡 Tip: To sync all stocks, modify the script or sync by universe`);
      break;

    case 'update':
      // Update all symbols with recent data
      const allUpdateSymbols = new Set<string>();
      Object.values(UNIVERSES).forEach(universe => {
        universe.forEach(s => allUpdateSymbols.add(s));
      });
      symbols = Array.from(allUpdateSymbols);
      daysBack = 10; // Last 10 calendar days
      console.log(`🔄 Update sync: ${symbols.length} symbols, last ${daysBack} days`);
      break;

    case 'symbol':
      if (!options.symbol) {
        throw new Error('Symbol required for symbol mode');
      }
      symbols = [options.symbol];
      daysBack = 1800; // Full history for specific symbol
      console.log(`🎯 Symbol sync: ${options.symbol}, ${daysBack} calendar days`);
      break;
  }

  // Fetch OHLC data from APIs
  console.log(`\n📡 Fetching data from DataSaham/Yahoo Finance...`);
  
  let fetchedCount = 0;
  let failedCount = 0;
  const startTime = Date.now();
  
  const ohlcMap = await fetchDatasahamHistoricalMap(symbols, daysBack);
  
  fetchedCount = ohlcMap.size;
  failedCount = symbols.length - ohlcMap.size;
  const fetchTime = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n✅ Data fetch complete in ${fetchTime}s`);
  console.log(`   Success: ${fetchedCount}/${symbols.length} stocks`);
  if (failedCount > 0) {
    console.log(`   Failed: ${failedCount} stocks (will retry with Yahoo Finance)`);
  }

  if (ohlcMap.size === 0) {
    console.error('❌ No data fetched from APIs');
    return;
  }

  console.log(`✅ Fetched data for ${ohlcMap.size}/${symbols.length} symbols`);

  // Prepare data for database insertion
  const records: any[] = [];
  let totalDays = 0;

  for (const [symbol, data] of ohlcMap.entries()) {
    const cleanSymbol = symbol.replace('.JK', '').toUpperCase();
    
    for (const row of data) {
      records.push({
        symbol: cleanSymbol,
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume || null,
        source: 'datasaham', // or determine from fetch source
        updated_at: new Date().toISOString()
      });
      totalDays++;
    }
    
    console.log(`  ${cleanSymbol}: ${data.length} days`);
  }

  console.log(`\n💾 Inserting ${records.length} records into database...`);

  // Insert in batches (Supabase limit: 1000 rows per request)
  const batchSize = 1000;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    // Use upsert to handle duplicates
    const { error } = await supabase
      .from('ohlc_historical_data')
      .upsert(batch, {
        onConflict: 'symbol,date',
        ignoreDuplicates: false // Update existing records
      });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      continue;
    }

    inserted += batch.length;
    
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}: ${batch.length} records`);
  }

  // Summary
  console.log(`\n✅ Sync Complete!`);
  console.log(`  Symbols processed: ${ohlcMap.size}`);
  console.log(`  Total records: ${inserted}`);
  console.log(`  Average days per symbol: ${Math.round(totalDays / ohlcMap.size)}`);

  // Check data coverage
  const { data: stats, error: statsError } = await supabase
    .from('ohlc_data_stats')
    .select('*')
    .in('symbol', Array.from(ohlcMap.keys()).map(s => s.replace('.JK', '').toUpperCase()));

  if (!statsError && stats) {
    console.log(`\n📊 Database Coverage:`);
    stats.slice(0, 10).forEach(stat => {
      console.log(`  ${stat.symbol}: ${stat.total_records} days (${stat.earliest_date} to ${stat.latest_date}) - ${stat.data_status}`);
    });
    if (stats.length > 10) {
      console.log(`  ... and ${stats.length - 10} more symbols`);
    }
  }

  console.log(`\n🎉 Done!\n`);
}

// Parse command line arguments
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  
  // Debug: show what arguments were received
  console.log('📋 Arguments received:', args);
  console.log('📋 Environment MODE:', process.env.SYNC_MODE);
  
  // Check environment variable first (for npm scripts)
  const envMode = process.env.SYNC_MODE;
  if (envMode === 'initial') {
    return { mode: 'initial' };
  }
  if (envMode === 'update') {
    return { mode: 'update' };
  }
  
  // Then check command line arguments
  if (args.includes('--initial')) {
    return { mode: 'initial' };
  }
  
  if (args.includes('--update')) {
    return { mode: 'update' };
  }
  
  const symbolIndex = args.indexOf('--symbol');
  if (symbolIndex !== -1 && args[symbolIndex + 1]) {
    return { mode: 'symbol', symbol: args[symbolIndex + 1].toUpperCase() };
  }
  
  // Check if first argument looks like a symbol (for convenience)
  if (args.length > 0 && !args[0].startsWith('--') && args[0].length <= 4) {
    return { mode: 'symbol', symbol: args[0].toUpperCase() };
  }
  
  const daysIndex = args.indexOf('--days');
  const daysBack = daysIndex !== -1 && args[daysIndex + 1] 
    ? parseInt(args[daysIndex + 1], 10) 
    : undefined;
  
  // Default to update mode
  return { mode: 'update', daysBack };
}

// Run sync
const options = parseArgs();
syncOHLCData(options)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
