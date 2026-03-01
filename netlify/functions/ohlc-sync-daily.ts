import { createClient } from '@supabase/supabase-js';
import { fetchDatasahamHistoricalMap } from '../../lib/datasaham';
import { UNIVERSES } from '../../lib/universes';
import { createBackgroundJobLog, updateBackgroundJobLog } from '../../lib/supabase';

/**
 * Netlify Scheduled Function - OHLC Data Sync
 * Runs daily at 07:00 WIB (00:00 UTC) to update historical OHLC data
 * 
 * This function syncs the latest 7 days of data for all stocks in the universes
 * to ensure the database has fresh data for the Minervini screener and other features.
 */
export default async (req: Request) => {
  const startTime = Date.now();
  let jobLogId: number | null = null;

  console.log('[OHLC Sync] Starting scheduled OHLC data sync...');

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create job log entry
    try {
      const jobLog = await createBackgroundJobLog('ohlc-sync', 0);
      jobLogId = jobLog.id;
      console.log(`[OHLC Sync] Created job log with ID: ${jobLogId}`);
    } catch (logError) {
      console.error('[OHLC Sync] Failed to create job log, continuing without logging:', logError);
    }

    // Get all unique symbols from all universes
    const allSymbols = new Set<string>();
    Object.values(UNIVERSES).forEach(universe => {
      universe.forEach(symbol => allSymbols.add(symbol));
    });
    const symbols = Array.from(allSymbols);
    const daysBack = 7; // Sync last 7 calendar days to ensure we have latest trading days

    console.log(`[OHLC Sync] Syncing ${symbols.length} symbols, last ${daysBack} days`);

    // Fetch OHLC data from APIs
    const fetchStart = Date.now();
    const ohlcMap = await fetchDatasahamHistoricalMap(symbols, daysBack);
    const fetchTime = Math.round((Date.now() - fetchStart) / 1000);

    const fetchedCount = ohlcMap.size;
    const failedCount = symbols.length - ohlcMap.size;

    console.log(`[OHLC Sync] Data fetch complete in ${fetchTime}s`);
    console.log(`[OHLC Sync] Success: ${fetchedCount}/${symbols.length} stocks`);

    if (failedCount > 0) {
      console.warn(`[OHLC Sync] Failed to fetch ${failedCount} stocks`);
    }

    if (ohlcMap.size === 0) {
      throw new Error('No data fetched from APIs');
    }

    // Insert data into database (batch by 500 records to avoid timeouts)
    console.log(`[OHLC Sync] Inserting data into database...`);
    
    const records: any[] = [];
    let totalDays = 0;

    for (const [symbol, ohlcData] of ohlcMap.entries()) {
      totalDays += ohlcData.length;
      for (const candle of ohlcData) {
        records.push({
          symbol: symbol.toUpperCase(),
          date: candle.date,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || null,
        });
      }
    }

    console.log(`[OHLC Sync] Total records to upsert: ${records.length}`);

    // Insert in batches
    const batchSize = 500;
    let inserted = 0;
    const insertStart = Date.now();

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('ohlc_historical_data')
        .upsert(batch, {
          onConflict: 'symbol,date',
          ignoreDuplicates: false // Update existing records
        });

      if (error) {
        console.error(`[OHLC Sync] Error inserting batch ${i / batchSize + 1}:`, error.message);
        continue;
      }

      inserted += batch.length;
      
      if ((i / batchSize) % 5 === 0) {
        console.log(`[OHLC Sync] Progress: ${inserted}/${records.length} records (${Math.round(inserted / records.length * 100)}%)`);
      }
    }

    const insertTime = Math.round((Date.now() - insertStart) / 1000);

    console.log(`[OHLC Sync] Database insertion complete in ${insertTime}s`);
    console.log(`[OHLC Sync] Total records: ${inserted}`);
    console.log(`[OHLC Sync] Average days per symbol: ${Math.round(totalDays / ohlcMap.size)}`);

    // Update job log with success
    if (jobLogId) {
      await updateBackgroundJobLog(jobLogId, {
        status: 'completed',
        success_count: inserted,
        metadata: {
          symbols_synced: fetchedCount,
          symbols_failed: failedCount,
          records_inserted: inserted,
          days_back: daysBack,
          fetch_time_seconds: fetchTime,
          insert_time_seconds: insertTime,
        },
      });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[OHLC Sync] Job completed in ${Math.round(elapsed / 1000)}s`);

    return new Response(
      JSON.stringify({
        success: true,
        symbols_synced: fetchedCount,
        symbols_failed: failedCount,
        records_inserted: inserted,
        elapsed_seconds: Math.round(elapsed / 1000),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error('[OHLC Sync] Job failed:', errorMsg);

    // Update job log with error
    if (jobLogId) {
      try {
        await updateBackgroundJobLog(jobLogId, {
          status: 'failed',
          error_message: errorMsg,
        });
      } catch (logError) {
        console.error('[OHLC Sync] Failed to update job log with error:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        elapsed_seconds: Math.round(elapsed / 1000),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
