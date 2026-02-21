'use client';

import { useState, useEffect, useRef } from 'react';
import InputForm from './InputForm';
import CompactResultCard from './CompactResultCard';
import BrokerSummaryCard from './BrokerSummaryCard';
import KeyStatsCard from './KeyStatsCard';
import AgentStoryCard from './AgentStoryCard';
import PriceGraph from './PriceGraph';
import BrokerFlowCard from './BrokerFlowCard';
import EmitenHistoryCard from './EmitenHistoryCard';
import TechnicalAnalysisCard from './TechnicalAnalysisCard';
import TradingPlanCard from './TradingPlanCard';
import BandarmologyCard from './BandarmologyCard';

import html2canvas from 'html2canvas';
import type { StockInput, StockAnalysisResult, KeyStatsData, AgentStoryResult } from '@/lib/types';
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

  // Technical, Trading Plan, Bandarmology
  const [technicalData, setTechnicalData] = useState<Record<string, unknown> | null>(null);
  const [tradingPlanData, setTradingPlanData] = useState<Record<string, unknown> | null>(null);
  const [bandarmologyData, setBandarmologyData] = useState<Record<string, unknown> | null>(null);
  const [technicalLoading, setTechnicalLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [bandarLoading, setBandarLoading] = useState(false);

  // Agent Story state
  const [agentStories, setAgentStories] = useState<AgentStoryResult[]>([]);
  const [storyStatus, setStoryStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'error'>('idle');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
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
    setKeyStats(null);
    setTechnicalData(null);
    setTradingPlanData(null);
    setBandarmologyData(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
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

      // Fetch Technical Analysis, Trading Plan, Bandarmology in parallel
      const emitenUpper = data.emiten.toUpperCase();
      setTechnicalLoading(true);
      setPlanLoading(true);
      setBandarLoading(true);

      Promise.all([
        fetch(`/api/technical?emiten=${emitenUpper}`).then((r) => r.json()),
        fetch(`/api/bandarmology?emiten=${emitenUpper}&days=10`).then((r) => r.json()),
      ])
        .then(([techJson, bandarJson]) => {
          if (techJson.success) setTechnicalData(techJson.data);
          if (bandarJson.success) setBandarmologyData(bandarJson.data);
        })
        .catch(console.error)
        .finally(() => {
          setTechnicalLoading(false);
          setBandarLoading(false);
        });

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
            // Resume polling only (GET) — do NOT create a new analysis via POST
            resumeStoryPolling(data.emiten);
          }
        }
      } catch (storyErr) {
        console.error('Failed to fetch existing agent story:', storyErr);
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
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
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
      // Trigger background analysis
      const response = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emiten,
          keyStats: keyStats
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Start polling for status
      resumeStoryPolling(emiten);

    } catch (err) {
      console.error('Failed to start analysis:', err);
      setStoryStatus('error');
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
        onAnalyzeAI={() => handleAnalyzeStory()}
        copiedText={copied}
        copiedImage={copiedImage}
        storyStatus={storyStatus}
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
        <div style={{ marginTop: '2rem' }}>
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

            {/* Technical Analysis */}
            {(technicalData || technicalLoading) && (
              <TechnicalAnalysisCard
                emiten={result.input.emiten}
                data={(technicalData as any) || {}}
                loading={technicalLoading}
              />
            )}

            {/* Trading Plan - show when we have data or are loading */}
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

            {/* Bandarmology - show when we have data or are loading */}
            {(bandarmologyData || bandarLoading) && (
              <BandarmologyCard
                data={(bandarmologyData as any) || {
                  emiten: result.input.emiten,
                  period: { from: '', to: '', days: 0 },
                  flowMomentum: 0,
                  flowMomentumSignal: 'neutral',
                  phase: 'neutral',
                  brokerComposition: {},
                  patternAlerts: [],
                  recommendation: '',
                  dailyFlows: [],
                }}
                loading={bandarLoading}
              />
            )}

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

            {/* Agent Story Section - Full Width */}
            <div style={{ gridColumn: '1 / -1', width: '100%' }}>
              {(agentStories.length > 0 || storyStatus !== 'idle') && (
                <AgentStoryCard
                  stories={agentStories}
                  status={storyStatus}
                  onRetry={() => handleAnalyzeStory()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
