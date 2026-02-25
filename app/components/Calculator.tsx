'use client';

import { useState, useEffect, useRef } from 'react';
import InputForm from './InputForm';
import CompactResultCard from './CompactResultCard';
import BrokerSummaryCard from './BrokerSummaryCard';
import KeyStatsCard from './KeyStatsCard';
import AgentStoryCard from './AgentStoryCard';
import BrakotBrekotCard from './BrakotBrekotCard';
import PriceGraph from './PriceGraph';
import BrokerFlowCard from './BrokerFlowCard';
import EmitenHistoryCard from './EmitenHistoryCard';
import TechnicalAnalysisCard from './TechnicalAnalysisCard';
import TradingPlanCard from './TradingPlanCard';
import CorporateActionsCard from './CorporateActionsCard';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import type { CorporateActions } from '@/lib/corporateActions';
import type { StockInput, StockAnalysisResult, KeyStatsData, AgentStoryResult, BrakotBrekotResult } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';
import { useAppUser } from './UserProvider';

interface CalculatorProps {
  selectedStock?: string | null;
}

// Helper function to format the result data for copying
function formatResultForCopy(result: StockAnalysisResult): string {
  const { input, stockbitData, marketData, calculated } = result;

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString() ?? '-';

  const calculateGain = (target: number) => {
    const gain = ((target - marketData.harga) / marketData.harga) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(2)}`;
  };

  const lines = [
    `ADIMOLGY: ${input.emiten.toUpperCase()}`,
    `${input.fromDate} s/d ${input.toDate}`,
    ``,
    `TOP BROKER`,
    `Broker: ${stockbitData.bandar}`,
    `∑ Brg: ${formatNumber(stockbitData.barangBandar)} lot`,
    `Avg Harga: Rp ${formatNumber(stockbitData.rataRataBandar)}`,
    ``,
    `MARKET DATA`,
    `Harga: Rp ${formatNumber(marketData.harga)}`,
    `Offer Max: Rp ${formatNumber(marketData.offerTeratas)}`,
    `Bid Min: Rp ${formatNumber(marketData.bidTerbawah)}`,
    `Fraksi: ${formatNumber(marketData.fraksi)}`,
    `∑ Bid: ${formatNumber(marketData.totalBid / 100)}`,
    `∑ Offer: ${formatNumber(marketData.totalOffer / 100)}`,
    ``,
    `CALCULATIONS`,
    `∑ Papan: ${formatNumber(calculated.totalPapan)}`,
    `Avg Bid-Offer: ${formatNumber(calculated.rataRataBidOfer)}`,
    `a (5% avg bandar): ${formatNumber(calculated.a)}`,
    `p (Brg/Avg Bid-Offer): ${formatNumber(calculated.p)}`,
    ``,
    `Target 1: ${calculated.targetRealistis1} (${calculateGain(calculated.targetRealistis1)}%)`,
    `Target 2: ${calculated.targetMax} (${calculateGain(calculated.targetMax)}%)`,
  ];

  return lines.join('\n');
}

export default function Calculator({ selectedStock }: CalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [keyStats, setKeyStats] = useState<KeyStatsData | null>(null);

  // Technical, Trading Plan
  const [technicalData, setTechnicalData] = useState<Record<string, unknown> | null>(null);
  const [tradingPlanData, setTradingPlanData] = useState<Record<string, unknown> | null>(null);
  const [corporateActionsData, setCorporateActionsData] = useState<CorporateActions | null>(null);
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [corporateActionsLoading, setCorporateActionsLoading] = useState(false);
  const [riskRewardData, setRiskRewardData] = useState<Record<string, any> | null>(null);
  const [riskRewardLoading, setRiskRewardLoading] = useState(false);

  // Agent Story state
  const [agentStories, setAgentStories] = useState<AgentStoryResult[]>([]);
  const [storyStatus, setStoryStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'error'>('idle');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // BrakotBrekot state
  const [brakotbrekotAnalyses, setBrakotbrekotAnalyses] = useState<BrakotBrekotResult[]>([]);
  const [brakotbrekotStatus, setBrakotbrekotStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'error'>('idle');
  const brakotbrekotPollRef = useRef<NodeJS.Timeout | null>(null);

  // Date state lifted from InputForm
  const [fromDate, setFromDate] = useState(getDefaultDate());
  const [toDate, setToDate] = useState(getDefaultDate());
  const { user } = useAppUser();

  // Reset result and error when a new stock is selected from sidebar
  useEffect(() => {
    if (selectedStock) {
      setResult(null);
      setError(null);
      setAgentStories([]);
      setStoryStatus('idle');
      setBrakotbrekotAnalyses([]);
      setBrakotbrekotStatus('idle');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (brakotbrekotPollRef.current) {
        clearInterval(brakotbrekotPollRef.current);
        brakotbrekotPollRef.current = null;
      }
      // Auto-analyze with current selected dates
      // This allows clicking watchlist items to RESPECT the date range selected by user
      handleSubmit({
        emiten: selectedStock,
        fromDate,
        toDate
      });
    }
  }, [selectedStock]);

  const handleSubmit = async (data: StockInput) => {
    if (!user) {
      setError('Silakan Connect Google (kanan atas) untuk menggunakan fitur penuh Adimology.');
      return;
    }
    window.dispatchEvent(new CustomEvent('stockbit-fetch-start'));
    setLoading(true);
    setError(null);
    setResult(null);
    setAgentStories([]);
    setStoryStatus('idle');
    setBrakotbrekotAnalyses([]);
    setBrakotbrekotStatus('idle');
    setKeyStats(null);
    setTechnicalData(null);
    setTradingPlanData(null);
    setCorporateActionsData(null);
    setRiskRewardData(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (brakotbrekotPollRef.current) {
      clearInterval(brakotbrekotPollRef.current);
      brakotbrekotPollRef.current = null;
    }

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze stock');
      }

      setResult(json.data);

      // Log user stock query for tracking
      try {
        await fetch('/api/usage/log-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            emiten: data.emiten,
            fromDate: data.fromDate,
            toDate: data.toDate,
            source: 'calculator',
          }),
        });
      } catch (e) {
        console.error('Failed to log user query:', e);
      }

      // Fetch KeyStats after getting result
      try {
        const keyStatsRes = await fetch(`/api/keystats?emiten=${data.emiten}`);
        const keyStatsJson = await keyStatsRes.json();
        if (keyStatsJson.success) {
          setKeyStats(keyStatsJson.data);
        }
      } catch (keyStatsErr) {
        console.error('Failed to fetch key stats:', keyStatsErr);
      }

      // Fetch Technical Analysis
      const emitenUpper = data.emiten.toUpperCase();
      setTechnicalLoading(true);

      fetch(`/api/technical?emiten=${emitenUpper}`)
        .then((r) => r.json())
        .then((techJson) => {
          if (techJson.success) setTechnicalData(techJson.data);
        })
        .catch(console.error)
        .finally(() => setTechnicalLoading(false));

      setCorporateActionsLoading(true);
      fetch(`/api/corporate-actions?emiten=${emitenUpper}`)
        .then((r) => r.json())
        .then((caJson) => {
          if (caJson.success) setCorporateActionsData(caJson.data);
        })
        .catch(console.error)
        .finally(() => setCorporateActionsLoading(false));

      if (json.data?.marketData?.harga && json.data?.calculated) {
        fetch('/api/trading-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emiten: emitenUpper,
            currentPrice: json.data.marketData.harga,
            targetRealistis: json.data.calculated.targetRealistis1,
            targetMax: json.data.calculated.targetMax,
            accountSize: 100_000_000,
          }),
        })
          .then((r) => r.json())
          .then((planJson) => {
            if (planJson.success) setTradingPlanData(planJson.data);
          })
          .catch(console.error)
          .finally(() => setPlanLoading(false));
      } else {
        setPlanLoading(false);
      }

      // Fetch Datasaham Retail Risk-Reward (Retail Opportunity) in parallel with other analytics
      setRiskRewardLoading(true);
      fetch(`/api/retail/risk-reward?symbol=${emitenUpper}`)
        .then((r) => r.json())
        .then((rrJson) => {
          if (rrJson.success) {
            const payload = (rrJson.data?.data as any) ?? rrJson.data;
            setRiskRewardData(payload || null);
          }
        })
        .catch(console.error)
        .finally(() => setRiskRewardLoading(false));

      // Fetch existing Agent Story if available
      try {
        const storyRes = await fetch(`/api/analyze-story?emiten=${data.emiten}`);
        const storyJson = await storyRes.json();
        if (storyJson.success && storyJson.data && Array.isArray(storyJson.data)) {
          setAgentStories(storyJson.data);
          const latestStory = storyJson.data[0];
          if (latestStory.status === 'completed') {
            setStoryStatus('completed');
          } else if (latestStory.status === 'processing' || latestStory.status === 'pending') {
            resumeStoryPolling(data.emiten);
          }
        }
      } catch (storyErr) {
        console.error('Failed to fetch existing agent story:', storyErr);
      }

      // Fetch existing BrakotBrekot analyses
      try {
        const bbRes = await fetch(`/api/analyze-brakotbrekot?emiten=${data.emiten}`);
        const bbJson = await bbRes.json();
        if (bbJson.success && bbJson.data && Array.isArray(bbJson.data)) {
          setBrakotbrekotAnalyses(bbJson.data);
          const latestBB = bbJson.data[0];
          if (latestBB.status === 'completed') {
            setBrakotbrekotStatus('completed');
          } else if (latestBB.status === 'processing' || latestBB.status === 'pending') {
            resumeBrakotBrekotPolling(data.emiten);
          }
        }
      } catch (bbErr) {
        console.error('Failed to fetch BrakotBrekot:', bbErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('stockbit-fetch-end'));
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFromDate(newFrom);
    setToDate(newTo);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (brakotbrekotPollRef.current) clearInterval(brakotbrekotPollRef.current);
    };
  }, []);

  // Handle token refresh to auto-retry failed analysis
  useEffect(() => {
    const handleTokenRefresh = () => {
      console.log('Token refreshed event received in Calculator');
      // If there's an error that looks like a token issue, retry the last analysis
      if (error && (error.toLowerCase().includes('token') || error.toLowerCase().includes('401'))) {
        const emitenToRetry = selectedStock || result?.input.emiten;
        if (emitenToRetry) {
          console.log(`Retrying analysis for ${emitenToRetry}`);
          handleSubmit({
            emiten: emitenToRetry,
            fromDate,
            toDate
          });
        }
      }
    };

    window.addEventListener('token-refreshed', handleTokenRefresh);
    return () => window.removeEventListener('token-refreshed', handleTokenRefresh);
  }, [error, selectedStock, result, fromDate, toDate]);

  // Resume polling only (GET) for an in-progress story — does NOT create a new analysis
  const resumeStoryPolling = (emiten: string) => {
    setStoryStatus('processing');
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/analyze-story?emiten=${emiten}`);
        const statusData = await statusRes.json();

        if (statusData.success && statusData.data && Array.isArray(statusData.data)) {
          const stories = statusData.data;
          setAgentStories(stories);

          const latest = stories[0];
          if (latest.status === 'completed') {
            setStoryStatus('completed');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (latest.status === 'error') {
            setStoryStatus('error');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (latest.status === 'processing') {
            setStoryStatus('processing');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  };

  // User-initiated: create a NEW analysis via POST + start polling
  const handleAnalyzeStory = async () => {
    if (!user) {
      setError('Silakan Connect Google (kanan atas) untuk menggunakan PandAi - Panduan AI.');
      return;
    }
    if (!result) return;

    window.dispatchEvent(new CustomEvent('stockbit-fetch-start'));
    const emiten = result.input.emiten.toUpperCase();
    setStoryStatus('pending');

    try {
      const response = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emiten, keyStats }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      resumeStoryPolling(emiten);
    } catch (err) {
      console.error('Failed to start analysis:', err);
      setStoryStatus('error');
    } finally {
      window.dispatchEvent(new CustomEvent('stockbit-fetch-end'));
    }
  };

  const resumeBrakotBrekotPolling = (emiten: string) => {
    setBrakotbrekotStatus('processing');
    if (brakotbrekotPollRef.current) clearInterval(brakotbrekotPollRef.current);

    brakotbrekotPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze-brakotbrekot?emiten=${emiten}`);
        const json = await res.json();

        if (json.success && json.data && Array.isArray(json.data)) {
          setBrakotbrekotAnalyses(json.data);
          const latest = json.data[0];
          if (latest.status === 'completed') {
            setBrakotbrekotStatus('completed');
            if (brakotbrekotPollRef.current) clearInterval(brakotbrekotPollRef.current);
          } else if (latest.status === 'error') {
            setBrakotbrekotStatus('error');
            if (brakotbrekotPollRef.current) clearInterval(brakotbrekotPollRef.current);
          }
        }
      } catch (err) {
        console.error('BrakotBrekot polling error:', err);
      }
    }, 5000);
  };

  const handleAnalyzeBrakotBrekot = async () => {
    if (!user) {
      setError('Silakan Connect Google (kanan atas) untuk menggunakan PandAi - Panduan AI.');
      return;
    }
    if (!result) return;

    const emiten = result.input.emiten.toUpperCase();
    setBrakotbrekotStatus('pending');

    try {
      const response = await fetch('/api/analyze-brakotbrekot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emiten,
          brokerSummary: result.brokerSummary,
          technicalData,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      resumeBrakotBrekotPolling(emiten);
    } catch (err) {
      console.error('Failed to start BrakotBrekot:', err);
      setBrakotbrekotStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      const formattedText = formatResultForCopy(result);
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyImage = async () => {
    const container = document.getElementById('compact-result-card-container');
    const cardElement = container?.querySelector('.compact-card') as HTMLElement;
    if (!cardElement) return;

    try {
      // Use html-to-image for much better quality and glassmorphism support
      const blob = await htmlToImage.toBlob(cardElement, {
        pixelRatio: 2,
        cacheBust: true,
        // Remove backdrop-filter during capture to prevent the "gray layer" effect
        // Use 'as any' to allow vendor prefixes in the style object
        style: {
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
        } as any,
        filter: (node: any) => {
          // Ignore the footer buttons and any element marked for ignore
          const exclusionClasses = ['compact-footer'];
          if (node.classList) {
            return !exclusionClasses.some(cls => node.classList.contains(cls)) && 
                   !node.hasAttribute?.('data-html2canvas-ignore');
          }
          return true;
        }
      });

      if (!blob) throw new Error('Failed to generate image blob');

      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed:', err);

        // 1. Fallback for iOS Safari / Mobile: Web Share API
        // This opens the native share sheet which is often preferred on mobile
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${result?.input.emiten || 'stock'}-analysis.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Stock Analysis Result',
            });
            return;
          }
        }

        // 2. If all else fails
        throw err;
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError('Failed to copy image. Try taking a screenshot manually.');
    }
  };

  const captureSection = async (id: string): Promise<{ canvas: HTMLCanvasElement; imgData: string } | null> => {
    const el = document.getElementById(id);
    if (!el) return null;
    const canvas = await html2canvas(el, {
      scale: 1.0,
      useCORS: true,
      logging: false,
      backgroundColor: '#0f0f17',
      allowTaint: false,
      foreignObjectRendering: false,
      ignoreElements: (node) => {
        if (node instanceof HTMLIFrameElement) return true;
        if (node instanceof HTMLScriptElement) return true;
        return false;
      },
      onclone: (clonedDoc, clonedEl) => {
        const tw = clonedDoc.getElementById('tradingview_widget');
        if (tw) {
          tw.innerHTML = '';
          const placeholder = clonedDoc.createElement('div');
          placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;height:300px;background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.15);border-radius:12px;color:rgba(255,255,255,0.5);font-size:0.85rem;';
          placeholder.textContent = 'Price Chart (TradingView — view live in app)';
          tw.appendChild(placeholder);
        }
        clonedEl.querySelectorAll?.('iframe').forEach((frame) => frame.remove());
      },
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.82);
    if (!imgData || imgData === 'data:,') return null;
    return { canvas, imgData };
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('calculator-result-export');
    if (!el || !result) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2 - 15;

      // Cover page - professional research header
      doc.setFillColor(15, 15, 23);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('EQUITY RESEARCH REPORT', margin, 35);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(102, 126, 234);
      doc.text(result.input.emiten.toUpperCase(), margin, 50);

      doc.setTextColor(180, 180, 190);
      doc.setFontSize(10);
      doc.text(`${result.sector || '—'}  •  Period: ${result.input.fromDate} — ${result.input.toDate}`, margin, 58);

      doc.setTextColor(150, 150, 160);
      doc.setFontSize(9);
      const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Generated: ${reportDate}`, margin, 68);

      doc.setDrawColor(60, 60, 80);
      doc.setLineWidth(0.5);
      doc.line(margin, 78, pageWidth - margin, 78);

      doc.setFontSize(9);
      doc.setTextColor(130, 130, 140);
      doc.text('This report contains Adimology analysis, AI Story insights, BrakotBrekot (Smart Money & Technical)', margin, 88);
      doc.text('analysis, broker summary, key statistics, and trading plan. For informational purposes only.', margin, 94);

      doc.setTextColor(100, 100, 110);
      doc.setFontSize(8);
      doc.text('Disclaimer: Not financial advice. Past performance does not guarantee future results.', margin, pageHeight - 15);

      const addImageToPage = (imgData: string, canvas: HTMLCanvasElement) => {
        doc.addPage();
        doc.setFillColor(15, 15, 23);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        const w = contentWidth;
        const h = contentHeight;
        const scaleW = w / canvas.width;
        const scaleH = h / canvas.height;
        const scale = Math.min(scaleW, scaleH);
        const fitWidth = canvas.width * scale;
        const fitHeight = canvas.height * scale;
        const x = margin + (w - fitWidth) / 2;
        const y = margin + (h - fitHeight) / 2;
        doc.addImage(imgData, 'JPEG', x, y, fitWidth, fitHeight, undefined, 'FAST');
      };

      const page2 = await captureSection('pdf-page-2');
      if (page2) addImageToPage(page2.imgData, page2.canvas);

      const page3 = await captureSection('pdf-page-3');
      if (page3) addImageToPage(page3.imgData, page3.canvas);

      const page4 = await captureSection('pdf-page-4');
      if (page4) addImageToPage(page4.imgData, page4.canvas);

      const page5 = await captureSection('pdf-page-5');
      if (page5) addImageToPage(page5.imgData, page5.canvas);

      // Add page numbers and footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 130);
        if (i >= 2) {
          doc.text(
            `Page ${i - 1} of ${totalPages - 1}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
          );
        }
        doc.text('twitter @iwandanu', pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`Research-Report-${result.input.emiten}-${timestamp}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Export PDF gagal: ${msg.includes('taint') || msg.includes('CORS') ? 'Konten chart/iframe tidak bisa di-capture. Coba sembunyikan grafik TradingView dulu.' : msg}`);
    }
  };

  return (
    <div className="container">


      <InputForm
        onSubmit={handleSubmit}
        loading={loading}
        initialEmiten={selectedStock}
        fromDate={fromDate}
        toDate={toDate}
        onDateChange={handleDateChange}
        onCopyText={handleCopy}
        onCopyImage={handleCopyImage}
        onExportPDF={handleExportPDF}
        onAnalyzeAI={() => handleAnalyzeStory()}
        onAnalyzeBrakotBrekot={() => handleAnalyzeBrakotBrekot()}
        copiedText={copied}
        copiedImage={copiedImage}
        storyStatus={storyStatus}
        brakotbrekotStatus={brakotbrekotStatus}
        hasResult={!!result}
      />

      {/* Fetching indicator moved to Navbar */}

      {error && (
        <div className="glass-card mt-4" style={{
          background: 'rgba(245, 87, 108, 0.1)',
          borderColor: 'var(--accent-warning)'
        }}>
          <h3>❌ Error</h3>
          <p style={{ color: 'var(--accent-warning)' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }} id="calculator-result-export">
          {/* PDF Page 2: Adimology, Broker Summary, KeyStats, Corp Actions, Technical, Trading Plan */}
          <div id="pdf-page-2" style={{ marginBottom: '2rem' }}>
            {result.isFromHistory && result.historyDate && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px',
                color: '#ffc107',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  Data broker live tidak tersedia. Menampilkan data history terakhir dari tanggal
                  <strong style={{ marginLeft: '4px', color: '#ffca2c' }}>
                    {new Date(result.historyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                </div>
              </div>
            )}
            <div className="cards-row" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div id="compact-result-card-container">
                <CompactResultCard
                  result={result}
                  onCopyText={handleCopy}
                  onCopyImage={handleCopyImage}
                  copiedText={copied}
                  copiedImage={copiedImage}
                />
              </div>


            </div>

            {/* Right Column: Broker Summary */}
            {result.brokerSummary && (
              <BrokerSummaryCard
                emiten={result.input.emiten}
                dateRange={`${result.input.fromDate} — ${result.input.toDate}`}
                brokerSummary={result.brokerSummary}
                sector={result.sector}
              />
            )}

            {/* KeyStats Card */}
            {keyStats && (
              <KeyStatsCard
                emiten={result.input.emiten}
                keyStats={keyStats}
              />
            )}

            {/* Corporate Actions | Technical Analysis | Trading Plan — 3 cards in one row, 1/3 each */}
            {/* Row 1: Technical + Trading Plan */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              {(technicalData || technicalLoading) && (
                <TechnicalAnalysisCard
                  emiten={result.input.emiten}
                  data={(technicalData as any) || {}}
                  loading={technicalLoading}
                />
              )}
              {(tradingPlanData || planLoading) && (
                <TradingPlanCard
                  data={(tradingPlanData as any) || {
                    emiten: result.input.emiten,
                    entry: {
                      price: result.marketData?.harga ?? 0,
                      type: 'market',
                      trend: '-',
                      signal: '-',
                    },
                    takeProfit: [],
                    stopLoss: { price: 0, percentLoss: 0, method: '-' },
                    riskReward: {
                      riskPerShare: 0,
                      rewardTP1: 0,
                      rewardTP2: 0,
                      rrToTP1: 0,
                      rrToTP2: 0,
                      quality: 'fair',
                    },
                    executionStrategy: [],
                  }}
                  loading={planLoading}
                />
              )}
            </div>

            {/* Row 2: Corporate Actions + Trading Plan (alternative by Datasaham.io) */}
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {(corporateActionsData || corporateActionsLoading) && (
                <CorporateActionsCard
                  emiten={result.input.emiten}
                  data={corporateActionsData}
                  loading={corporateActionsLoading}
                />
              )}
              {(riskRewardData || riskRewardLoading) && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: '0.75rem' }}>
                    Trading Plan (alternative by Datasaham.io)
                  </h3>
                  {riskRewardLoading && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</p>
                  )}
                  {riskRewardData && !riskRewardLoading && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Harga sekarang</span>
                        <span style={{ fontWeight: 600 }}>
                          Rp {Number(riskRewardData.current_price ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Stop loss rekomendasi</span>
                        <span style={{ fontWeight: 600 }}>
                          Rp{' '}
                          {Number(
                            riskRewardData.stop_loss_recommended ?? 0
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Risk/Reward ratio</span>
                        <span style={{ fontWeight: 600 }}>
                          {Number(riskRewardData.risk_reward_ratio ?? 0).toFixed(2)} (
                          {riskRewardData.recommendation || '-'})
                        </span>
                      </div>
                      {Array.isArray(riskRewardData.target_prices) && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Target Price
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {riskRewardData.target_prices.slice(0, 3).map((t: any, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <span>
                                  Rp {Number(t.level ?? 0).toLocaleString('id-ID')} ({t.probability}
                                  %)
                                </span>
                                <span>
                                  Reward {Number(t.reward ?? 0).toFixed(2)}% • RR{' '}
                                  {Number(t.risk_reward ?? 0).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* PDF Page 3: Riwayat Analisis, Advanced Chart, Broker Flow */}
          <div id="pdf-page-3" style={{ width: '100%', marginBottom: '2rem' }}>
            {/* Emiten History Card - Full Width */}
            <div style={{
              gridColumn: '1 / -1',
              width: '100%'
            }}>
              <EmitenHistoryCard emiten={result.input.emiten} />
            </div>

            {/* Price Graph + Broker Flow */}
            <div style={{
              gridColumn: '1 / -1',
              width: '100%',
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              alignItems: 'stretch'
            }}>
              <div style={{ flex: '1 1 0', minWidth: '400px' }}>
                <PriceGraph ticker={result.input.emiten} />
              </div>
              <div style={{ flex: '1 1 0', minWidth: '400px', display: 'flex' }}>
                <BrokerFlowCard emiten={result.input.emiten} />
              </div>
            </div>
          </div>

          {/* PDF Page 4: AI Story Analysis */}
          {(agentStories.length > 0 || storyStatus !== 'idle') && (
            <div id="pdf-page-4" style={{ width: '100%', marginBottom: '2rem' }}>
              <AgentStoryCard
                  stories={agentStories}
                  status={storyStatus}
                  onRetry={() => handleAnalyzeStory()}
                />
            </div>
          )}

          {/* PDF Page 5: BrakotBrekot */}
          {(brakotbrekotAnalyses.length > 0 || brakotbrekotStatus !== 'idle') && (
            <div id="pdf-page-5" style={{ width: '100%' }}>
              <BrakotBrekotCard
                  analyses={brakotbrekotAnalyses}
                  status={brakotbrekotStatus}
                  onRetry={() => handleAnalyzeBrakotBrekot()}
                />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
