const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_IDS = process.env.TELEGRAM_ALLOWED_CHAT_IDS
  ? process.env.TELEGRAM_ALLOWED_CHAT_IDS.split(',').map((id) => id.trim())
  : null;

const MAX_MESSAGE_LENGTH = 4000; // Telegram limit is 4096, leave buffer

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  if (!BOT_TOKEN) return;

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > MAX_MESSAGE_LENGTH) {
    const chunk = remaining.slice(0, MAX_MESSAGE_LENGTH);
    const lastNewline = chunk.lastIndexOf('\n');
    const splitAt = lastNewline > MAX_MESSAGE_LENGTH / 2 ? lastNewline + 1 : MAX_MESSAGE_LENGTH;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  if (remaining) chunks.push(remaining);

  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  }
}

function formatStoryForTelegram(story: {
  emiten: string;
  kesimpulan?: string;
  matriks_story?: { kategori_story: string; deskripsi_katalis: string; potensi_dampak_harga: string }[];
  swot_analysis?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
  strategi_trading?: { tipe_saham?: string; target_entry?: string; exit_strategy?: { take_profit?: string; stop_loss?: string } };
  keystat_signal?: string;
  checklist_katalis?: { item: string; dampak_instan: string }[];
}): string {
  const lines: string[] = [];
  lines.push(`<b>📊 AI Story Analysis — ${story.emiten}</b>`);
  lines.push('');

  if (story.kesimpulan) {
    lines.push('<b>Kesimpulan</b>');
    lines.push(escapeHtml(story.kesimpulan));
    lines.push('');
  }

  if (story.matriks_story && story.matriks_story.length > 0) {
    lines.push('<b>Matriks Story & Katalis</b>');
    story.matriks_story.forEach((m, i) => {
      lines.push(`${i + 1}. [${escapeHtml(m.kategori_story)}]`);
      lines.push(`   • ${escapeHtml(m.deskripsi_katalis)}`);
      lines.push(`   • Dampak: ${escapeHtml(m.potensi_dampak_harga)}`);
      lines.push('');
    });
  }

  if (story.swot_analysis) {
    const swot = story.swot_analysis;
    lines.push('<b>SWOT</b>');
    if (swot.strengths?.length)
      lines.push(`  💪 Strengths: ${escapeHtml(swot.strengths.join('; '))}`);
    if (swot.weaknesses?.length)
      lines.push(`  ⚠ Weaknesses: ${escapeHtml(swot.weaknesses.join('; '))}`);
    if (swot.opportunities?.length)
      lines.push(`  🎯 Opportunities: ${escapeHtml(swot.opportunities.join('; '))}`);
    if (swot.threats?.length)
      lines.push(`  🚨 Threats: ${escapeHtml(swot.threats.join('; '))}`);
    lines.push('');
  }

  if (story.strategi_trading) {
    const s = story.strategi_trading;
    lines.push('<b>Strategi Trading</b>');
    lines.push(`  Tipe: ${escapeHtml(s.tipe_saham || '-')}`);
    lines.push(`  Entry: ${escapeHtml(s.target_entry || '-')}`);
    if (s.exit_strategy) {
      lines.push(`  TP: ${escapeHtml(s.exit_strategy.take_profit || '-')}`);
      lines.push(`  SL: ${escapeHtml(s.exit_strategy.stop_loss || '-')}`);
    }
    lines.push('');
  }

  if (story.keystat_signal) {
    lines.push('<b>Key Stats Signal</b>');
    lines.push(escapeHtml(story.keystat_signal));
    lines.push('');
  }

  if (story.checklist_katalis && story.checklist_katalis.length > 0) {
    lines.push('<b>Checklist Katalis</b>');
    story.checklist_katalis.forEach((c, i) => {
      lines.push(`  ${i + 1}. ${escapeHtml(c.item)} → ${escapeHtml(c.dampak_instan)}`);
    });
  }

  return lines.join('\n').trim();
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getDefaultDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 6) today.setDate(today.getDate() - 1);
  else if (dayOfWeek === 0) today.setDate(today.getDate() - 2);
  return today.toISOString().split('T')[0];
}

function formatAdimologyForTelegram(data: {
  input: { emiten: string; fromDate: string; toDate: string };
  stockbitData: { bandar?: string; barangBandar?: number; rataRataBandar?: number };
  marketData: { harga?: number; offerTeratas?: number; bidTerbawah?: number; fraksi?: number; totalBid?: number; totalOffer?: number };
  calculated: {
    totalPapan?: number;
    rataRataBidOfer?: number;
    rata_rata_bid_ofer?: number;
    a?: number;
    p?: number;
    targetRealistis1?: number;
    targetMax?: number;
    target_realistis?: number;
    target_max?: number;
  };
  isFromHistory?: boolean;
  historyDate?: string;
}): string {
  const { input, stockbitData, marketData, calculated } = data;
  const fmt = (n: number | null | undefined) => (n != null ? Number(n).toLocaleString('id-ID') : '-');
  const gain = (target: number) => {
    const h = marketData.harga ?? 0;
    if (!h) return '-';
    const g = ((target - h) / h) * 100;
    return `${g >= 0 ? '+' : ''}${g.toFixed(2)}%`;
  };

  const t1 = calculated.targetRealistis1 ?? calculated.target_realistis;
  const t2 = calculated.targetMax ?? calculated.target_max;
  const rra = calculated.rataRataBidOfer ?? calculated.rata_rata_bid_ofer;

  const lines: string[] = [
    `<b>📈 ADIMOLOGY — ${input.emiten}</b>`,
    `${input.fromDate} s/d ${input.toDate}`,
    '',
    '<b>TOP BROKER</b>',
    `Broker: ${stockbitData.bandar ?? '-'}`,
    `∑ Brg: ${fmt(stockbitData.barangBandar)} lot`,
    `Avg Harga: Rp ${fmt(stockbitData.rataRataBandar)}`,
    '',
    '<b>MARKET DATA</b>',
    `Harga: Rp ${fmt(marketData.harga)}`,
    `Offer Max: Rp ${fmt(marketData.offerTeratas)}`,
    `Bid Min: Rp ${fmt(marketData.bidTerbawah)}`,
    `Fraksi: ${fmt(marketData.fraksi)}`,
    `∑ Bid: ${fmt((marketData.totalBid ?? 0) / 100)}`,
    `∑ Offer: ${fmt((marketData.totalOffer ?? 0) / 100)}`,
    '',
    '<b>CALCULATIONS</b>',
    `∑ Papan: ${fmt(calculated.totalPapan)}`,
    `Avg Bid-Offer: ${fmt(rra)}`,
    `a (5% avg bandar): ${fmt(calculated.a)}`,
    `p (Brg/Avg Bid-Offer): ${fmt(calculated.p)}`,
    '',
    t1 != null ? `Target R1: Rp ${fmt(t1)} (${gain(t1)})` : '',
    t2 != null ? `Target Max: Rp ${fmt(t2)} (${gain(t2)})` : '',
  ];

  if (data.isFromHistory && data.historyDate) {
    lines.push('');
    lines.push(`<i>⚠ Data history: ${data.historyDate}</i>`);
  }

  return lines.filter(Boolean).join('\n');
}

export default async (req: Request) => {
  // GET: debug endpoint - verify function runs and env vars
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        ok: true,
        hasToken: !!BOT_TOKEN,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!BOT_TOKEN) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN not configured in Netlify env vars');
    return new Response('OK', { status: 200 });
  }

  try {
    let body: { message?: { chat?: { id: number }; text?: string } };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return new Response('OK', { status: 200 });
    }
    const message = body?.message;
    if (!message || !message.chat) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id as number;
    const text = (message.text || '').trim();

    if (ALLOWED_CHAT_IDS && !ALLOWED_CHAT_IDS.includes(String(chatId))) {
      await sendTelegramMessage(
        chatId,
        '⛔ Bot hanya dapat digunakan oleh user yang terdaftar. Hubungi admin untuk mendaftar.'
      );
      return new Response('OK', { status: 200 });
    }

    if (!text) {
      return new Response('OK', { status: 200 });
    }

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const emiten = parts[1]?.toUpperCase();
    const fromDate = parts[2];
    const toDate = parts[3];

    if (cmd === '/start') {
      await sendTelegramMessage(
        chatId,
        '🤖 <b>Adimology Bot</b>\n\n' +
          'Alternatif akses analisis saham saat tidak bisa buka web.\n\n' +
          '<b>Perintah:</b>\n' +
          '/adimology EMITEN — Kalkulator target (spt di web)\n' +
          '/story EMITEN — Minta analisis AI\n' +
          '/result EMITEN — Lihat hasil analisis AI\n' +
          '/help — Bantuan'
      );
      return new Response('OK', { status: 200 });
    }

    if (cmd === '/help') {
      await sendTelegramMessage(
        chatId,
        '📖 <b>Bantuan</b>\n\n' +
          '/adimology EMITEN — Analisis target (spt Calculator di web). Butuh token Stockbit tersinkron.\n' +
          '  Contoh: /adimology BBCA atau /adimology BBCA 2025-02-17 2025-02-19\n\n' +
          '/story EMITEN — Memulai analisis AI Story (1–2 menit)\n' +
          '/result EMITEN — Menampilkan hasil analisis AI terakhir\n\n' +
          'Contoh: /story BBCA lalu tunggu 1–2 menit, lalu /result BBCA'
      );
      return new Response('OK', { status: 200 });
    }

    if (cmd === '/adimology') {
      if (!emiten || emiten.length > 4) {
        await sendTelegramMessage(
          chatId,
          '❌ Format: /adimology EMITEN [fromDate] [toDate]\nContoh: /adimology BBCA atau /adimology BBCA 2025-02-17 2025-02-19'
        );
        return new Response('OK', { status: 200 });
      }

      const baseUrl =
        process.env.URL && !process.env.URL.includes('localhost')
          ? process.env.URL
          : `http://${req.headers.get('host') || 'localhost:8888'}`;
      const apiBase = baseUrl.replace(/\/$/, '');
      const dateStr = getDefaultDate();
      const reqFrom = fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate) ? fromDate : dateStr;
      const reqTo = toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate) ? toDate : dateStr;

      try {
        await sendTelegramMessage(chatId, `⏳ Mengambil data <b>${emiten}</b>...`);

        const stockRes = await fetch(`${apiBase}/api/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emiten, fromDate: reqFrom, toDate: reqTo }),
        });

        const json = await stockRes.json();

        if (!json.success) {
          await sendTelegramMessage(
            chatId,
            `❌ <b>${emiten}</b>: ${json.error || 'Gagal menganalisis'}`
          );
          return new Response('OK', { status: 200 });
        }

        const formatted = formatAdimologyForTelegram(json.data);
        await sendTelegramMessage(chatId, formatted);
      } catch (err) {
        console.error('[Telegram] adimology error:', err);
        await sendTelegramMessage(
          chatId,
          `❌ Gagal: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
      return new Response('OK', { status: 200 });
    }

    if (cmd === '/story') {
      if (!emiten || emiten.length > 4) {
        await sendTelegramMessage(
          chatId,
          '❌ Format: /story EMITEN (contoh: /story BBCA)'
        );
        return new Response('OK', { status: 200 });
      }

      try {
        const { createAgentStory } = await import('../../lib/supabase');
        const story = await createAgentStory(emiten);
        const baseUrl =
          process.env.URL && !process.env.URL.includes('localhost')
            ? process.env.URL
            : `http://${req.headers.get('host') || 'localhost:8888'}`;
        const functionsUrl = `${baseUrl.replace(/\/$/, '')}/.netlify/functions`;

        fetch(
          `${functionsUrl}/analyze-story-background?emiten=${emiten}&id=${story.id}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyStats: null }),
          }
        ).catch((err) => console.error('[Telegram] Failed to trigger analysis:', err));

        await sendTelegramMessage(
          chatId,
          `✅ Analisis AI untuk <b>${emiten}</b> dimulai.\n\n` +
            'Proses memakan waktu 1–2 menit. Ketik:\n' +
            `<code>/result ${emiten}</code>\n` +
            'untuk melihat hasilnya.'
        );
      } catch (err) {
        console.error('[Telegram] createAgentStory error:', err);
        await sendTelegramMessage(
          chatId,
          `❌ Gagal memulai analisis: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
      return new Response('OK', { status: 200 });
    }

    if (cmd === '/result') {
      if (!emiten || emiten.length > 4) {
        await sendTelegramMessage(
          chatId,
          '❌ Format: /result EMITEN (contoh: /result BBCA)'
        );
        return new Response('OK', { status: 200 });
      }

      try {
        const { getAgentStoryByEmiten } = await import('../../lib/supabase');
        const story = await getAgentStoryByEmiten(emiten);
        if (!story) {
          await sendTelegramMessage(
            chatId,
            `Tidak ada hasil analisis untuk <b>${emiten}</b>. Gunakan /story ${emiten} terlebih dahulu.`
          );
          return new Response('OK', { status: 200 });
        }

        if (story.status === 'pending' || story.status === 'processing') {
          await sendTelegramMessage(
            chatId,
            `⏳ Analisis <b>${emiten}</b> masih berjalan. Coba lagi dalam 1–2 menit.`
          );
          return new Response('OK', { status: 200 });
        }

        if (story.status === 'error') {
          await sendTelegramMessage(
            chatId,
            `❌ Analisis <b>${emiten}</b> gagal:\n${story.error_message || 'Unknown error'}`
          );
          return new Response('OK', { status: 200 });
        }

        const formatted = formatStoryForTelegram(story);
        await sendTelegramMessage(chatId, formatted);
      } catch (err) {
        console.error('[Telegram] getAgentStory error:', err);
        await sendTelegramMessage(
          chatId,
          `❌ Gagal mengambil hasil: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
      return new Response('OK', { status: 200 });
    }

    // Unknown command - send help hint
    await sendTelegramMessage(
      chatId,
      'Gunakan /help untuk melihat perintah yang tersedia.'
    );
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Telegram] Webhook error:', error instanceof Error ? error.stack : error);
    return new Response('OK', { status: 200 });
  }
};
