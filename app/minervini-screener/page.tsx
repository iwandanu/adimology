'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MinerviniResult, MinerviniCriteria, StageAnalysis } from '@/lib/minervini';
import { supabase } from '@/lib/supabase';

const UNIVERSES = [
  { id: 'syariah', label: 'Syariah (DES)', count: 70, description: 'Shariah-compliant stocks' },
  { id: 'lq45', label: 'LQ45', count: 46, description: 'Top 45 liquid stocks' },
  { id: 'idx80', label: 'IDX80', count: 66, description: 'Top 80 stocks by liquidity' },
  { id: 'liquid', label: 'Liquid (LQ45+IDX80)', count: 80, description: 'Combined liquid stocks' },
];

const CRITERIA_LABELS: Record<keyof MinerviniCriteria, { short: string; full: string }> = {
  c1_priceAboveMA150_200: {
    short: 'C1',
    full: 'Price > MA150 & MA200',
  },
  c2_ma150AboveMA200: {
    short: 'C2',
    full: 'MA150 > MA200',
  },
  c3_ma200TrendingUp: {
    short: 'C3',
    full: 'MA200 Trending Up (1 month)',
  },
  c4_ma50AboveMAs: {
    short: 'C4',
    full: 'MA50 > MA150 & MA200',
  },
  c5_priceAboveMA50: {
    short: 'C5',
    full: 'Price > MA50',
  },
  c6_priceAbove30PercentLow: {
    short: 'C6',
    full: 'Price > 30% from 52W Low',
  },
  c7_priceWithin25PercentHigh: {
    short: 'C7',
    full: 'Price within 25% of 52W High',
  },
  c8_relativeStrengthAbove70: {
    short: 'C8',
    full: 'RS > 70 (vs Sector)',
  },
};

interface ScreenerResponse {
  results: MinerviniResult[];
  count: number;
  scannedAt: string;
  universe: string;
  minScore: number;
}

export default function MinerviniScreenerPage() {
  const router = useRouter();
  const [universe, setUniverse] = useState('syariah');
  const [minScore, setMinScore] = useState(6);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreenerResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`/api/minervini-screener?universe=${universe}&minScore=${minScore}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      setResults(json.data);

      // Save results to database
      if (json.data.results.length > 0) {
        await saveResultsToDatabase(json.data);
      }
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to run screener'}`);
    } finally {
      setLoading(false);
    }
  };

  const saveResultsToDatabase = async (data: ScreenerResponse) => {
    try {
      const records = data.results.map(stock => ({
        emiten: stock.emiten,
        sector: stock.sector,
        price: stock.price,
        score: stock.score,
        rs: stock.rs,
        week_52_high: stock.week52High,
        week_52_low: stock.week52Low,
        ma50: stock.ma50,
        ma150: stock.ma150,
        ma200: stock.ma200,
        c1: stock.criteria.c1_priceAboveMA150_200,
        c2: stock.criteria.c2_ma150AboveMA200,
        c3: stock.criteria.c3_ma200TrendingUp,
        c4: stock.criteria.c4_ma50AboveMAs,
        c5: stock.criteria.c5_priceAboveMA50,
        c6: stock.criteria.c6_priceAbove30PercentLow,
        c7: stock.criteria.c7_priceWithin25PercentHigh,
        c8: stock.criteria.c8_relativeStrengthAbove70,
        universe: data.universe,
        scanned_at: data.scannedAt
      }));

      const { error } = await supabase
        .from('minervini_screening_results')
        .insert(records);

      if (error) {
        console.error('Failed to save screening results:', error);
      } else {
        console.log(`Saved ${records.length} screening results to database`);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const loadHistoricalData = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('minervini_screening_results')
        .select('*')
        .eq('universe', universe)
        .gte('score', minScore)
        .order('scanned_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Group by scan date
      const grouped = data.reduce((acc: any, row: any) => {
        const date = new Date(row.scanned_at).toLocaleDateString('id-ID');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(row);
        return acc;
      }, {});

      setHistoricalData(Object.entries(grouped).map(([date, stocks]) => ({ date, stocks })));
      setShowComparison(true);
    } catch (error) {
      console.error('Error loading historical data:', error);
      alert('Failed to load historical data');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showComparison && historicalData.length === 0) {
      loadHistoricalData();
    }
  }, [showComparison]);

  const formatNumber = (num: number) => num.toLocaleString('id-ID');
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageBadgeStyle = (stage: string) => {
    switch (stage) {
      case 'Stage 1':
        return { background: 'rgba(59, 130, 246, 0.15)', color: 'rgb(59, 130, 246)', border: '1px solid rgb(59, 130, 246)' };
      case 'Stage 2':
        return { background: 'rgba(34, 197, 94, 0.15)', color: 'rgb(34, 197, 94)', border: '1px solid rgb(34, 197, 94)' };
      case 'Stage 3':
        return { background: 'rgba(251, 191, 36, 0.15)', color: 'rgb(251, 191, 36)', border: '1px solid rgb(251, 191, 36)' };
      case 'Stage 4':
        return { background: 'rgba(239, 68, 68, 0.15)', color: 'rgb(239, 68, 68)', border: '1px solid rgb(239, 68, 68)' };
      default:
        return { background: 'rgba(156, 163, 175, 0.15)', color: 'rgb(156, 163, 175)', border: '1px solid rgb(156, 163, 175)' };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 className="page-title">Minervini Screener</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Filter saham berdasarkan 8 kriteria Mark Minervini untuk menemukan kandidat breakout Stage 2.
      </p>

      {/* Criteria Explanation Card */}
      <div className="glass-card-static" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📊 8 Kriteria Minervini</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '0.75rem' 
        }}>
          {Object.entries(CRITERIA_LABELS).map(([key, { short, full }]) => (
            <div
              key={key}
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{short}</span>
              {': '}
              <span style={{ color: 'var(--text-secondary)' }}>{full}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass-card-static" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>⚙️ Filter Screening</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="input-label compact-label">Universe</label>
            <select
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              className="input-field compact-input"
            >
              {UNIVERSES.map((u) => (
                <option key={u.id} value={u.id} title={u.description}>
                  {u.label} ({u.count} saham)
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="input-label compact-label">Minimum Score</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="input-field compact-input"
            >
              {[8, 7, 6, 5, 4].map((s) => (
                <option key={s} value={s}>
                  {s}/8 kriteria
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="solid-btn"
            style={{
              flex: '0 0 auto',
              height: '38px',
              padding: '0 1.5rem',
            }}
          >
            {loading ? 'Scanning...' : 'Run Minervini Scan'}
          </button>

          <button
            onClick={() => setShowComparison(!showComparison)}
            disabled={loadingHistory}
            className="outline-btn"
            style={{
              flex: '0 0 auto',
              height: '38px',
              padding: '0 1.5rem',
            }}
          >
            {loadingHistory ? 'Loading...' : showComparison ? 'Hide History' : 'Show Historical Comparison'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Menganalisis {UNIVERSES.find((u) => u.id === universe)?.count} saham...
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ini mungkin memakan waktu 2-3 menit.
          </p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Summary Card */}
          <div className="glass-card-static" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                  ✅ {results.count} Saham Lolos (Score {minScore}/8+)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Scanned: {formatDate(results.scannedAt)}
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>8/8</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                    {results.results.filter(r => r.score === 8).length}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>7/8</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-warning)' }}>
                    {results.results.filter(r => r.score === 7).length}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>6/8</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {results.results.filter(r => r.score === 6).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          {results.count === 0 ? (
            <div className="glass-card-static" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Tidak ada saham yang memenuhi kriteria dengan score {minScore}/8+.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Coba turunkan minimum score atau pilih universe yang berbeda.
              </p>
            </div>
          ) : (
            <div className="glass-card-static">
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                  <thead style={{ background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Emiten
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Score
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        RS
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Price
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Stage
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C1
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C2
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C3
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C4
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C5
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C6
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C7
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        C8
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((stock, index) => (
                      <tr
                        key={stock.emiten}
                        style={{
                          borderBottom: index < results.results.length - 1 ? '1px solid var(--border-color)' : 'none',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => router.push(`/?symbol=${stock.emiten}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)';
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-primary)' }}>
                            {stock.emiten}
                          </div>
                          {stock.sector && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {stock.sector}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '1rem',
                              color:
                                stock.score === 8
                                  ? 'var(--accent-success)'
                                  : stock.score === 7
                                  ? 'var(--accent-warning)'
                                  : 'var(--text-primary)',
                            }}
                          >
                            {stock.score}/8
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                          {stock.rs.toFixed(1)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {formatNumber(stock.price)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {stock.stage ? (
                            <div 
                              style={{ 
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title={`${stock.stage.description}\nConfidence: ${stock.stage.confidence}%\n${stock.stage.signals.join('\n')}`}
                            >
                              <span
                                style={{
                                  ...getStageBadgeStyle(stock.stage.stage),
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {stock.stage.stage}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {stock.stage.confidence}%
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                        {(Object.keys(CRITERIA_LABELS) as Array<keyof MinerviniCriteria>).map((criteriaKey) => (
                          <td key={criteriaKey} style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            {stock.criteria[criteriaKey] ? (
                              <span style={{ color: 'var(--accent-success)', fontSize: '1.1rem' }}>✓</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>✗</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Historical Comparison */}
      {showComparison && historicalData.length > 0 && (
        <div className="glass-card-static" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📈 Historical Comparison</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Tracking stocks that passed the screening over time
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {historicalData.slice(0, 5).map(({ date, stocks }: any, index: number) => (
              <div key={index}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{date}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {stocks.length} stocks
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {stocks.slice(0, 15).map((stock: any) => (
                    <div
                      key={stock.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onClick={() => router.push(`/?symbol=${stock.emiten}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
                        {stock.emiten}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: stock.score === 8 ? 'var(--accent-success)' : stock.score === 7 ? 'var(--accent-warning)' : 'var(--text-primary)',
                        }}
                      >
                        {stock.score}/8
                      </span>
                    </div>
                  ))}
                  {stocks.length > 15 && (
                    <div style={{ 
                      padding: '0.5rem 0.75rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      +{stocks.length - 15} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {historicalData.length > 5 && (
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Showing latest 5 scans out of {historicalData.length} total
            </p>
          )}
        </div>
      )}
    </div>
  );
}
