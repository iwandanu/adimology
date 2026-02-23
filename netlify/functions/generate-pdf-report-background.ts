/**
 * Background function: runs Adimology + Story + BrakotBrekot, generates PDF, sends to Telegram.
 * Triggered by /pdf EMITEN from the bot. No separate commands needed.
 */
import {
  createAgentStory,
  getAgentStoryByEmiten,
  createBrakotBrekotAnalysis,
  getBrakotBrekotAnalysesByEmiten,
} from '../../lib/supabase';
import { generateFullReportPDF } from '../../lib/pdfReport';
import type { StockAnalysisResult } from '../../lib/types';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function getDefaultDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 6) today.setDate(today.getDate() - 1);
  else if (dayOfWeek === 0) today.setDate(today.getDate() - 2);
  return today.toISOString().split('T')[0];
}

async function pollUntil<T>(
  check: () => Promise<{ done: boolean; data: T | null }>,
  options: { intervalMs: number; timeoutMs: number }
): Promise<T | null> {
  const { intervalMs, timeoutMs } = options;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { done, data } = await check();
    if (done) return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

async function sendTelegramDocument(chatId: number, pdfBuffer: Uint8Array, filename: string): Promise<void> {
  if (!BOT_TOKEN) return;

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('caption', `📄 Research Report ${filename.replace('.pdf', '')}`);
  formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: formData,
  });
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const emiten = url.searchParams.get('emiten')?.toUpperCase();
  const chatIdStr = url.searchParams.get('chat_id');
  const chatId = chatIdStr ? parseInt(chatIdStr, 10) : null;

  if (!emiten || emiten.length > 4 || !chatId) {
    return new Response(JSON.stringify({ error: 'Missing emiten or chat_id' }), { status: 400 });
  }

  const baseUrl =
    process.env.URL && !process.env.URL.includes('localhost')
      ? process.env.URL.replace(/\/$/, '')
      : 'http://localhost:8888';
  const apiBase = baseUrl;
  const functionsUrl = `${apiBase}/.netlify/functions`;

  console.log(`[PDF Report] Starting for ${emiten}, chat_id=${chatId}`);

  try {
    // 1. Adimology
    const dateStr = getDefaultDate();
    const stockRes = await fetch(`${apiBase}/api/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emiten, fromDate: dateStr, toDate: dateStr }),
    });
    const stockJson = await stockRes.json();

    if (!stockJson.success) {
      await sendTelegramMessage(
        chatId,
        `❌ PDF gagal: Adimology ${emiten} — ${stockJson.error || 'Data tidak tersedia'}`
      );
      return new Response(JSON.stringify({ error: stockJson.error }), { status: 200 });
    }

    const adimologyData = stockJson.data as StockAnalysisResult;

    // 2. Story — create, trigger, poll
    const story = await createAgentStory(emiten);
    await fetch(`${functionsUrl}/analyze-story-background?emiten=${emiten}&id=${story.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyStats: null }),
    }).catch((e) => console.error('[PDF Report] Story trigger failed:', e));

    const storyData = await pollUntil(
      async () => {
        const s = await getAgentStoryByEmiten(emiten);
        if (!s) return { done: false, data: null };
        if (s.status === 'completed') return { done: true, data: s };
        if (s.status === 'error') return { done: true, data: s };
        return { done: false, data: null };
      },
      { intervalMs: 5000, timeoutMs: 180000 }
    );

    const finalStory = storyData && storyData.status === 'completed' ? storyData : null;

    // 3. BrakotBrekot — create, trigger, poll (fetch technical for better analysis)
    let technicalData = null;
    try {
      const techRes = await fetch(`${apiBase}/api/technical?emiten=${emiten}`);
      const techJson = await techRes.json();
      if (techJson.success) technicalData = techJson.data;
    } catch (e) {
      console.warn('[PDF Report] Technical fetch failed:', e);
    }
    const bbAnalysis = await createBrakotBrekotAnalysis(emiten);
    const stockDataForBrakot = {
      brokerSummary: adimologyData.brokerSummary ?? null,
      technicalData,
      bandarmology: null,
    };
    await fetch(
      `${functionsUrl}/analyze-brakotbrekot-background?emiten=${emiten}&id=${bbAnalysis.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockDataForBrakot),
      }
    ).catch((e) => console.error('[PDF Report] BrakotBrekot trigger failed:', e));

    const bbData = await pollUntil(
      async () => {
        const analyses = await getBrakotBrekotAnalysesByEmiten(emiten, 1);
        const latest = analyses?.[0];
        if (!latest) return { done: false, data: null };
        if (latest.status === 'completed') return { done: true, data: latest };
        if (latest.status === 'error') return { done: true, data: latest };
        return { done: false, data: null };
      },
      { intervalMs: 5000, timeoutMs: 180000 }
    );

    const finalBrakot =
      bbData && bbData.status === 'completed' ? bbData : null;

    // 4. Generate PDF
    const pdfBuffer = generateFullReportPDF(adimologyData, finalStory, finalBrakot);
    const filename = `Research-Report-${emiten}-${dateStr}.pdf`;

    await sendTelegramDocument(chatId, pdfBuffer, filename);
    await sendTelegramMessage(chatId, `✅ PDF report <b>${emiten}</b> berhasil dikirim.`);

    console.log(`[PDF Report] Completed for ${emiten}`);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[PDF Report] Error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await sendTelegramMessage(chatId, `❌ PDF report <b>${emiten}</b> gagal: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), { status: 200 });
  }
};
