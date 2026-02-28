import { createBackgroundJobLog, updateBackgroundJobLog } from '../../lib/supabase';

/**
 * Netlify Scheduled Function - Minervini Screener
 * Runs daily at 08:00 and 16:00 WIB (01:00 and 09:00 UTC)
 */
export default async (req: Request) => {
  const startTime = Date.now();
  let jobLogId: number | null = null;

  console.log('[Minervini Scheduled] Starting scheduled scan...');

  try {
    // Create job log entry
    try {
      const jobLog = await createBackgroundJobLog('minervini-screener', 0);
      jobLogId = jobLog.id;
      console.log(`[Minervini Scheduled] Created job log with ID: ${jobLogId}`);
    } catch (logError) {
      console.error('[Minervini Scheduled] Failed to create job log, continuing without logging:', logError);
    }

    // Call the API route internally with Syariah universe and minScore 6
    const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/minervini-screener?universe=syariah&minScore=6`;

    console.log(`[Minervini Scheduled] Calling API: ${apiUrl}`);

    const response = await fetch(apiUrl);
    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'Screening failed');
    }

    const { results, count, scannedAt } = json.data;

    console.log(`[Minervini Scheduled] Screening completed: ${count} stocks passed`);

    // Log breakdown by score
    const score8 = results.filter((r: any) => r.score === 8).length;
    const score7 = results.filter((r: any) => r.score === 7).length;
    const score6 = results.filter((r: any) => r.score === 6).length;

    console.log(`[Minervini Scheduled] Breakdown: 8/8=${score8}, 7/8=${score7}, 6/8=${score6}`);

    // Update job log with success
    if (jobLogId) {
      await updateBackgroundJobLog(
        jobLogId,
        'completed',
        count,
        undefined,
        JSON.stringify({
          scannedAt,
          breakdown: { score8, score7, score6 },
          universe: 'syariah',
          minScore: 6,
        })
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Minervini Scheduled] Job completed in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        count,
        elapsed,
        breakdown: { score8, score7, score6 },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error('[Minervini Scheduled] Job failed:', errorMsg);

    // Update job log with error
    if (jobLogId) {
      try {
        await updateBackgroundJobLog(jobLogId, 'error', 0, errorMsg);
      } catch (logError) {
        console.error('[Minervini Scheduled] Failed to update job log with error:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        elapsed,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
