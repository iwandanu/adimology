/**
 * Server-side PDF report generator for Telegram bot.
 * Combines Adimology + AI Story + BrakotBrekot into a single PDF.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StockAnalysisResult } from './types';
import type { AgentStoryResult } from './types';
import type { BrakotBrekotResult } from './types';

const fmt = (n: number | null | undefined) => (n != null ? Number(n).toLocaleString('id-ID') : '-');

function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(title, 14, y);
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1, 200, y + 1);
  return y + 6;
}

function addTextBlock(doc: jsPDF, text: string, startY: number, maxWidth: number = 180): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 55);
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  doc.text(lines, 14, startY);
  return startY + lines.length * 5 + 4;
}

export function generateFullReportPDF(
  adimologyData: StockAnalysisResult,
  storyData: AgentStoryResult | null,
  brakotbrekotData: BrakotBrekotResult | null
): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Cover page
  doc.setFillColor(15, 15, 23);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUITY RESEARCH REPORT', margin, 35);
  doc.setFontSize(14);
  doc.setTextColor(102, 126, 234);
  doc.text(adimologyData.input.emiten.toUpperCase(), margin, 50);
  doc.setTextColor(180, 180, 190);
  doc.setFontSize(10);
  doc.text(
    `${adimologyData.sector || '—'}  •  Period: ${adimologyData.input.fromDate} — ${adimologyData.input.toDate}`,
    margin,
    58
  );
  doc.setFontSize(9);
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${reportDate}`, margin, 68);
  doc.setDrawColor(60, 60, 80);
  doc.line(margin, 78, pageWidth - margin, 78);
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 140);
  doc.text(
    'This report contains Adimology, AI Story, and BrakotBrekot analysis. For informational purposes only.',
    margin,
    88
  );
  doc.text('Disclaimer: Not financial advice. Past performance does not guarantee future results.', margin, 94);

  let y = margin + 20;

  // Page 2: Adimology
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  y = addSectionHeader(doc, 'ADIMOLOGY', y);

  const { input, stockbitData, marketData, calculated } = adimologyData;
  const t1 = calculated.targetRealistis1 ?? (calculated as any).target_realistis;
  const t2 = calculated.targetMax ?? (calculated as any).target_max;
  const gain = (t: number) => {
    const h = marketData.harga ?? 0;
    if (!h) return '';
    const g = ((t - h) / h) * 100;
    return ` (${g >= 0 ? '+' : ''}${g.toFixed(2)}%)`;
  };

  const adimLines = [
    `Period: ${input.fromDate} — ${input.toDate}`,
    '',
    'Top Broker:',
    `  Broker: ${stockbitData?.bandar ?? '-'}`,
    `  ∑ Brg: ${fmt(stockbitData?.barangBandar)} lot`,
    `  Avg Harga: Rp ${fmt(stockbitData?.rataRataBandar)}`,
    '',
    'Market Data:',
    `  Harga: Rp ${fmt(marketData?.harga)}`,
    `  Target R1: Rp ${fmt(t1)}${t1 ? gain(t1) : ''}`,
    `  Target Max: Rp ${fmt(t2)}${t2 ? gain(t2) : ''}`,
  ];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 55);
  doc.text(adimLines, margin, y);
  y += adimLines.length * 5 + 12;

  // Page 3: AI Story
  if (storyData && storyData.status === 'completed') {
    y = addSectionHeader(doc, 'AI STORY ANALYSIS', y);

    if (storyData.kesimpulan) {
      y = addTextBlock(doc, storyData.kesimpulan, y) + 4;
    }

    if (storyData.matriks_story && storyData.matriks_story.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Matriks Story & Katalis', margin, y);
      y += 6;
      storyData.matriks_story.forEach((m, i) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`${i + 1}. [${m.kategori_story}]`, margin, y);
        y += 5;
        y = addTextBlock(doc, `  • ${m.deskripsi_katalis}`, y, 175) - 4;
        doc.text(`  • Dampak: ${m.potensi_dampak_harga}`, margin + 4, y);
        y += 8;
      });
    }

    if (storyData.swot_analysis) {
      const swot = storyData.swot_analysis;
      doc.setFont('helvetica', 'bold');
      doc.text('SWOT', margin, y);
      y += 6;
      const swotItems = [
        ['Strengths:', swot.strengths?.join('; ') ?? ''],
        ['Weaknesses:', swot.weaknesses?.join('; ') ?? ''],
        ['Opportunities:', swot.opportunities?.join('; ') ?? ''],
        ['Threats:', swot.threats?.join('; ') ?? ''],
      ];
      swotItems.forEach(([label, val]) => {
        if (val) {
          doc.setFont('helvetica', 'normal');
          y = addTextBlock(doc, `${label} ${val}`, y, 175) + 2;
        }
      });
      y += 6;
    }

    if (storyData.strategi_trading) {
      const s = storyData.strategi_trading;
      doc.setFont('helvetica', 'bold');
      doc.text('Strategi Trading', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`  Tipe: ${s.tipe_saham || '-'}  |  Entry: ${s.target_entry || '-'}`, margin, y);
      y += 5;
      if (s.exit_strategy) {
        doc.text(`  TP: ${s.exit_strategy.take_profit || '-'}  |  SL: ${s.exit_strategy.stop_loss || '-'}`, margin, y);
        y += 8;
      }
    }

    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }
  }

  // Page 4: BrakotBrekot
  if (brakotbrekotData && brakotbrekotData.status === 'completed') {
    y = addSectionHeader(doc, 'BRAKOTBREKOT (Smart Money & Technical)', y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Status: ${brakotbrekotData.status_final ?? '-'}  |  Skor: ${brakotbrekotData.total_skor ?? '-'}/100`, margin, y);
    y += 8;
    if (brakotbrekotData.fase_saat_ini) {
      y = addTextBlock(doc, `Fase: ${brakotbrekotData.fase_saat_ini}`, y) + 4;
    }
    if (brakotbrekotData.pola_terdeteksi && brakotbrekotData.pola_terdeteksi.length > 0) {
      doc.text('Pola terdeteksi: ' + brakotbrekotData.pola_terdeteksi.join('; '), margin, y);
      y += 8;
    }
    if (brakotbrekotData.kesimpulan_trading_plan) {
      doc.setFont('helvetica', 'bold');
      doc.text('Kesimpulan & Trading Plan', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      y = addTextBlock(doc, brakotbrekotData.kesimpulan_trading_plan, y) + 8;
    }

    const rincian = brakotbrekotData.rincian_skor;
    if (rincian && typeof rincian === 'object') {
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Skor', margin, y);
      y += 6;
      const modules = [
        'supply_absorption',
        'compression',
        'bb_squeeze',
        'elliott_wave',
        'time_projection',
        'anti_distribution',
      ] as const;
      const labels: Record<string, string> = {
        supply_absorption: 'Supply Absorption',
        compression: 'Compression',
        bb_squeeze: 'BB Squeeze',
        elliott_wave: 'Elliott Wave',
        time_projection: 'Time Projection',
        anti_distribution: 'Anti Distribution',
      };
      modules.forEach((key) => {
        const m = (rincian as any)[key];
        if (m && typeof m === 'object') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(
            `  ${labels[key] || key}: ${m.nilai ?? 0}/${m.maks ?? 0} — ${(m.alasan || '').substring(0, 60)}...`,
            margin,
            y
          );
          y += 5;
        }
      });
    }
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text('twitter @iwandanu', pageWidth - margin, pageHeight - 10, { align: 'right' });

  return doc.output('arraybuffer') as Uint8Array;
}
