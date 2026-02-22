import {
  updateBrakotBrekotAnalysis,
  createBackgroundJobLog,
  appendBackgroundJobLogEntry,
  updateBackgroundJobLog,
} from '../../lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { analyzeBandarmology } from '../../lib/bandarmology';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BRAKOT_AI_MODEL = process.env.BRAKOT_AI_MODEL || process.env.STORY_AI_MODEL || 'gemini-2.5-flash-preview-05-20';

const BRAKOT_SYSTEM_PROMPT = `Name: BEI Smart Money & Technical Assistant
Role & Tone: Kamu adalah asisten analis trading saham profesional khusus Bursa Efek Indonesia (BEI). Kamu ahli dalam Smart Money Concept (SMC), Wyckoff Theory, Bandarmologi, dan Analisis Teknikal. Gunakan bahasa Indonesia yang profesional, ringkas, dan langsung pada intinya.

Tugas Utama: Analisis data saham (Price Action, Volume, dan Broker Summary) yang diberikan pengguna. Lakukan skoring dan kategorisasi secara ketat berdasarkan framework berikut.

1. DETEKSI FASE AKUMULASI (Accumulation Phases)
Klasifikasikan fase saat ini berdasarkan data transaksi:
*Early Accumulation: 2-3 hari konsisten beli.
*Mid Accumulation: 4-6 hari, volume mulai naik.
*Late Accumulation: 7+ hari, hampir siap markup.
*Markup Ready: Semua sinyal align, siap breakout.
*Distribution: Smart money mulai keluar.

2. DETEKSI POLA BROKER (Pattern Detection)
Identifikasi pola berikut dari data broker summary:
*Crossing: Broker sama di buy & sell side -> Signal: Potensi distribusi terselubung.
*Dominasi: 1 broker > 25% volume -> Signal: Big player masuk.
*Retail Trap: Retail beli, smart money jual -> Signal: Bearish untuk retail.
*Smart Money Entry: Multiple SM brokers akumulasi -> Signal: Bullish.
*Markup Signal: Semua kondisi align -> Signal: Strong bullish.
*Broker Consistency: Broker sama beli berhari-hari -> Signal: Akumulasi kuat.

3. MODUL PENILAIAN & BOBOT (Scoring System)
Evaluasi saham berdasarkan 6 modul ini. Berikan nilai parsial hingga mencapai bobot maksimal jika syarat terpenuhi. Total skor maksimal adalah 100.
*Supply Absorption (Maks 25): Deteksi akumulasi smart money melalui volume dan price action.
*Compression (Maks 20): Volatility contraction - range harga yang menyempit.
*BB Squeeze (Maks 15): Bollinger Band squeeze detection.
*Elliott Wave (Maks 15): Posisi wave dan Fibonacci retracement yang mendukung.
*Time Projection (Maks 15): Fibonacci time windows + planetary aspects.
*Anti-Distribution (Maks 10): Filter untuk menghindari fase distribusi (jika tidak ada tanda distribusi, beri nilai penuh).

4. PENENTUAN STATUS (Status Levels)
Jumlahkan skor dari 6 modul di atas, lalu tentukan status final secara absolut:
*PRE-MARKUP (Skor >= 47): Siap breakout dalam waktu dekat.
*SIAP (Skor 35 - 46): Hampir siap, perlu monitoring ketat.
*WATCHLIST (Skor 24 - 34): Masih dalam tahap akumulasi awal.
*ABAIKAN (Skor < 24): Belum menunjukkan sinyal pre-markup.`;

const BRAKOT_JSON_FORMAT = `PASTIKAN OUTPUT HANYA JSON VALID, tanpa markdown atau teks lain. Format:
{
  "saham": "KODE",
  "total_skor": 0,
  "status_final": "PRE-MARKUP|SIAP|WATCHLIST|ABAIKAN",
  "fase_saat_ini": "string",
  "pola_terdeteksi": ["string"],
  "rincian_skor": {
    "supply_absorption": {"nilai": 0, "maks": 25, "alasan": "string"},
    "compression": {"nilai": 0, "maks": 20, "alasan": "string"},
    "bb_squeeze": {"nilai": 0, "maks": 15, "alasan": "string"},
    "elliott_wave": {"nilai": 0, "maks": 15, "alasan": "string"},
    "time_projection": {"nilai": 0, "maks": 15, "alasan": "string"},
    "anti_distribution": {"nilai": 0, "maks": 10, "alasan": "string"}
  },
  "kesimpulan_trading_plan": "string"
}`;

export default async (req: Request) => {
  const startTime = Date.now();
  let jobLogId: number | null = null;
  const url = new URL(req.url);
  const emiten = url.searchParams.get('emiten')?.toUpperCase();
  const analysisId = url.searchParams.get('id');

  console.log('[BrakotBrekot] Starting background analysis...');

  try {
    if (!emiten || !analysisId) {
      return new Response(JSON.stringify({ error: 'Missing emiten or id' }), { status: 400 });
    }

    try {
      const jobLog = await createBackgroundJobLog('analyze-brakotbrekot', 1);
      jobLogId = jobLog.id;
      if (jobLogId) {
        await appendBackgroundJobLogEntry(jobLogId, {
          level: 'info',
          message: 'Starting BrakotBrekot analysis',
          emiten,
        });
      }
    } catch (logError) {
      console.error('[BrakotBrekot] Failed to create job log:', logError);
    }

    let brokerSummary = null;
    let technicalData = null;
    let bandarmologyData = null;

    try {
      const body = await req.json();
      brokerSummary = body.brokerSummary;
      technicalData = body.technicalData;
      bandarmologyData = body.bandarmology;
    } catch {
      console.log('[BrakotBrekot] No JSON body or invalid JSON');
    }

    if (!bandarmologyData) {
      try {
        bandarmologyData = await analyzeBandarmology(emiten, 10);
      } catch (e) {
        console.warn('[BrakotBrekot] Bandarmology fetch failed:', e);
      }
    }

    if (!GEMINI_API_KEY) {
      const errMsg = 'GEMINI_API_KEY not configured';
      await updateBrakotBrekotAnalysis(parseInt(analysisId), {
        status: 'error',
        error_message: errMsg,
      });
      if (jobLogId) {
        await updateBackgroundJobLog(jobLogId, { status: 'failed', error_message: errMsg });
      }
      return new Response(JSON.stringify({ error: errMsg }), { status: 500 });
    }

    await updateBrakotBrekotAnalysis(parseInt(analysisId), { status: 'processing' });

    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'info',
        message: `Analyzing using ${BRAKOT_AI_MODEL}...`,
        emiten,
      });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const dataContext = `
DATA SAHAM UNTUK ${emiten}:

BROKER SUMMARY:
${JSON.stringify(brokerSummary || {}, null, 2)}

TECHNICAL ANALYSIS:
${JSON.stringify(technicalData || {}, null, 2)}

BANDARMOLOGY (Multi-day broker flow):
${JSON.stringify(bandarmologyData || {}, null, 2)}
`;

    const userPrompt = `${BRAKOT_SYSTEM_PROMPT}

${dataContext}

Analisis saham ${emiten} berdasarkan data di atas. Berikan output dalam format JSON.

${BRAKOT_JSON_FORMAT}`;

    const response = await ai.models.generateContent({
      model: BRAKOT_AI_MODEL,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    let text = '';
    if (typeof (response as { text?: string }).text === 'string') {
      text = (response as { text: string }).text;
    } else {
      const cand = (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0];
      text = cand?.content?.parts?.[0]?.text ?? '';
    }
    let parsed: Record<string, unknown>;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      const errMsg = 'Failed to parse AI response';
      console.error('[BrakotBrekot] Parse error:', parseErr);
      await updateBrakotBrekotAnalysis(parseInt(analysisId), {
        status: 'error',
        error_message: errMsg,
      });
      if (jobLogId) {
        await appendBackgroundJobLogEntry(jobLogId, {
          level: 'error',
          message: errMsg,
          emiten,
          details: { raw: text.substring(0, 500) },
        });
        await updateBackgroundJobLog(jobLogId, { status: 'failed', error_message: errMsg });
      }
      return new Response(JSON.stringify({ error: errMsg }), { status: 500 });
    }

    const rincian = parsed.rincian_skor as Record<string, { nilai?: number; maks?: number; alasan?: string }> | undefined;
    const pola = Array.isArray(parsed.pola_terdeteksi) ? parsed.pola_terdeteksi : [];

    await updateBrakotBrekotAnalysis(parseInt(analysisId), {
      status: 'completed',
      total_skor: typeof parsed.total_skor === 'number' ? parsed.total_skor : 0,
      status_final: String(parsed.status_final || ''),
      fase_saat_ini: String(parsed.fase_saat_ini || ''),
      pola_terdeteksi: pola,
      rincian_skor: rincian || {},
      kesimpulan_trading_plan: String(parsed.kesimpulan_trading_plan || ''),
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[BrakotBrekot] Completed for ${emiten} in ${duration}s`);

    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'info',
        message: 'Analysis completed successfully',
        emiten,
        details: { duration_seconds: duration },
      });
      await updateBackgroundJobLog(jobLogId, {
        status: 'completed',
        success_count: 1,
        metadata: { duration_seconds: duration },
      });
    }

    return new Response(JSON.stringify({ success: true, emiten }), { status: 200 });
  } catch (error) {
    const errMsg = String(error);
    console.error('[BrakotBrekot] Critical error:', error);

    if (jobLogId) {
      await appendBackgroundJobLogEntry(jobLogId, {
        level: 'error',
        message: `Analysis failed: ${errMsg}`,
        emiten,
      });
      await updateBackgroundJobLog(jobLogId, { status: 'failed', error_message: errMsg });
    }

    if (analysisId) {
      await updateBrakotBrekotAnalysis(parseInt(analysisId), {
        status: 'error',
        error_message: errMsg,
      });
    }

    return new Response(JSON.stringify({ error: errMsg }), { status: 500 });
  }
};
