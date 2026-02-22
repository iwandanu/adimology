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
import type { CorporateActions } from '@/lib/corporateActions';
import type { StockInput, StockAnalysisResult, KeyStatsData, AgentStoryResult, BrakotBrekotResult } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';

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
    if (!result) return;

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
    const cardElement = document.getElementById('compact-result-card-container');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
      });

      // Wrap toBlob in a Promise to keep the async chain active for Safari's strict user-gesture checks
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

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

  const handleExportPDF = async () => {
    const el = document.getElementById('calculator-result-export');
    if (!el || !result) return;

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f0f17',
      });

      const imgData = canvas.toDataURL('image/png');
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

      // Content pages - split canvas across pages
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      doc.addPage();
      doc.setFillColor(15, 15, 23);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight);

      while (heightLeft > contentHeight) {
        position = heightLeft - contentHeight;
        doc.addPage();
        doc.setFillColor(15, 15, 23);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        doc.addImage(imgData, 'PNG', margin, margin - position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // Add page numbers to all content pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 130);
        doc.text(
          `Page ${i - 1} of ${totalPages - 1}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`Research-Report-${result.input.emiten}-${timestamp}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setError('Failed to export PDF. Please try again.');
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

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="text-secondary mt-2">Fetching data from Stockbit...</p>
        </div>
      )}

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

          {/* Side-by-side Cards Container */}
          <div className="cards-row">
            {/* Left Column: Compact Result */}
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
            <div
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
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
                    entry: { price: result.marketData?.harga ?? 0, type: 'market', trend: '-', signal: '-' },
                    takeProfit: [],
                    stopLoss: { price: 0, percentLoss: 0, method: '-' },
                    riskReward: { riskPerShare: 0, rewardTP1: 0, rewardTP2: 0, rrToTP1: 0, rrToTP2: 0, quality: 'fair' },
                    executionStrategy: [],
                  }}
                  loading={planLoading}
                />
              )}
            </div>

            {/* Emiten History Card - Full Width */}
            <div style={{
              gridColumn: '1 / -1',
              width: '100%'
            }}>
              <EmitenHistoryCard emiten={result.input.emiten} />
            </div>

            {/* Price Graph + Broker Flow Section */}
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

            {/* Agent Story + BrakotBrekot Section - Full Width */}
            <div style={{ gridColumn: '1 / -1', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(agentStories.length > 0 || storyStatus !== 'idle') && (
                <AgentStoryCard
                  stories={agentStories}
                  status={storyStatus}
                  onRetry={() => handleAnalyzeStory()}
                />
              )}
              {(brakotbrekotAnalyses.length > 0 || brakotbrekotStatus !== 'idle') && (
                <BrakotBrekotCard
                  analyses={brakotbrekotAnalyses}
                  status={brakotbrekotStatus}
                  onRetry={() => handleAnalyzeBrakotBrekot()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
