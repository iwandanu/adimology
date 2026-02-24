/* Retail Opportunity dashboard using Datasaham Retail endpoints:
 * - /api/retail/multibagger
 * - /api/retail/breakout-alerts
 * - /api/retail/risk-reward?symbol=XXX
 * - /api/retail/sector-rotation
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Types mapped roughly from api.datasaham.io/swagger ---

interface MultibaggerCandidate {
  symbol: string;
  name: string;
  multibagger_score: number;
  potential_return: string;
  timeframe: string;
  current_price: number;
  risk_level: string;
  sector: string;
  entry_zone?: {
    ideal_price: number;
    max_price: number;
  };
}

interface MultibaggerPayload {
  scan_date: string;
  total_candidates: number;
  candidates: MultibaggerCandidate[];
}

interface BreakoutAlert {
  symbol: string;
  name: string;
  alert_type: string;
  severity: string;
  price: number;
  change_percentage: number;
  volume: string;
  volume_vs_avg: number;
  breakout_probability: number;
  action: string;
  target: number;
  stop_loss: number;
}

interface BreakoutPayload {
  scan_date: string;
  total_alerts: number;
  alerts: BreakoutAlert[];
}

interface SectorRotationSector {
  sector_id: string;
  sector_name: string;
  momentum_score: number;
  status: string;
  avg_return_today: number;
  total_value_formatted: string;
  recommendation: string;
}

interface SectorRotationPayload {
  analysis_date: string;
  market_phase: string;
  hot_sectors: SectorRotationSector[];
  cold_sectors: SectorRotationSector[];
}

export default function RetailOpportunityPage() {
  const router = useRouter();
  const [multibagger, setMultibagger] = useState<MultibaggerPayload | null>(null);
  const [breakouts, setBreakouts] = useState<BreakoutPayload | null>(null);
  const [sectorRotation, setSectorRotation] = useState<SectorRotationPayload | null>(null);
  const [loading, setLoading] = useState({
    multibagger: false,
    breakouts: false,
    sectorRotation: false,
  });
  const [error, setError] = useState<string | null>(null);

  const loadMultibagger = async () => {
    try {
      setLoading((s) => ({ ...s, multibagger: true }));
      const res = await fetch('/api/retail/multibagger');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load multibagger scan');
      setMultibagger(json.data as MultibaggerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load multibagger scan');
    } finally {
      setLoading((s) => ({ ...s, multibagger: false }));
    }
  };

  const loadBreakouts = async () => {
    try {
      setLoading((s) => ({ ...s, breakouts: true }));
      const res = await fetch('/api/retail/breakout-alerts');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load breakout alerts');
      setBreakouts(json.data as BreakoutPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load breakout alerts');
    } finally {
      setLoading((s) => ({ ...s, breakouts: false }));
    }
  };

  const loadSectorRotation = async () => {
    try {
      setLoading((s) => ({ ...s, sectorRotation: true }));
      const res = await fetch('/api/retail/sector-rotation');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load sector rotation');
      const payload = (json.data as { data?: SectorRotationPayload })?.data ?? json.data;
      setSectorRotation(payload as SectorRotationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sector rotation');
    } finally {
      setLoading((s) => ({ ...s, sectorRotation: false }));
    }
  };

  useEffect(() => {
    loadMultibagger();
    loadBreakouts();
    loadSectorRotation();
  }, []);

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Retail Opportunity</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Terhubung langsung ke endpoint &quot;Retail Opportunity&quot; Datasaham.io: multibagger
          scanner, breakout alerts, risk-reward per saham, dan sector rotation.
        </p>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(245, 87, 108, 0.5)',
              color: '#f5576c',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Multibagger Scanner */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Multibagger Scanner</h3>
            <button
              type="button"
              onClick={loadMultibagger}
              disabled={loading.multibagger}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: loading.multibagger ? 'default' : 'pointer',
                opacity: loading.multibagger ? 0.6 : 1,
              }}
            >
              {loading.multibagger ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Kandidat multibagger berdasarkan kombinasi trend, volume, foreign flow, dan akumulasi.
          </p>

          {!multibagger && !loading.multibagger && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Belum ada data. Klik &quot;Refresh&quot; untuk memuat multibagger scan.
            </p>
          )}

          {multibagger && (
            <div
              style={{
                marginTop: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {multibagger.candidates.map((c) => (
                <div
                  key={c.symbol}
                  className="glass-card"
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/?symbol=${c.symbol}`)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.symbol}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        {c.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: 'rgba(124, 58, 237, 0.18)',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                        }}
                      >
                        Score {c.multibagger_score}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        {c.potential_return} • {c.timeframe}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Harga</span>
                    <span style={{ fontWeight: 600 }}>
                      Rp {c.current_price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {c.entry_zone && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Entry zone</span>
                      <span style={{ fontWeight: 600 }}>
                        Rp {c.entry_zone.ideal_price.toLocaleString('id-ID')} - Rp{' '}
                        {c.entry_zone.max_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      marginTop: '0.4rem',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {c.risk_level.toLowerCase()} risk
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{c.sector}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breakout Alerts */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Breakout Alerts</h3>
            <button
              type="button"
              onClick={loadBreakouts}
              disabled={loading.breakouts}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: loading.breakouts ? 'default' : 'pointer',
                opacity: loading.breakouts ? 0.6 : 1,
              }}
            >
              {loading.breakouts ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Alert breakout volume/harga untuk saham dengan peluang kelanjutan trend kuat.
          </p>

          {breakouts && (
            <div
              style={{
                marginTop: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {breakouts.alerts.map((a) => (
                <div
                  key={`${a.symbol}-${a.alert_type}-${a.price}`}
                  className="glass-card"
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                  }}
                  onClick={() => router.push(`/?symbol=${a.symbol}`)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.symbol}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        {a.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background:
                            a.severity === 'HIGH'
                              ? 'rgba(245, 87, 108, 0.18)'
                              : 'rgba(234, 179, 8, 0.18)',
                          color:
                            a.severity === 'HIGH'
                              ? 'var(--accent-warning)'
                              : 'var(--text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {a.alert_type.replace(/_/g, ' ')}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        {a.breakout_probability}% prob.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Harga</span>
                    <span style={{ fontWeight: 600 }}>
                      Rp {a.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Δ Hari Ini</span>
                    <span style={{ fontWeight: 600 }}>
                      {a.change_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Volume</span>
                    <span style={{ fontWeight: 600 }}>
                      {a.volume} ({a.volume_vs_avg.toFixed(1)}x)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginTop: '0.4rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Target</span>
                    <span style={{ fontWeight: 600 }}>
                      Rp {a.target.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Stop Loss</span>
                    <span style={{ fontWeight: 600 }}>
                      Rp {a.stop_loss.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: '0.4rem',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {a.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sector Rotation */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Sector Rotation</h3>
            <button
              type="button"
              onClick={loadSectorRotation}
              disabled={loading.sectorRotation}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: loading.sectorRotation ? 'default' : 'pointer',
                opacity: loading.sectorRotation ? 0.6 : 1,
              }}
            >
              {loading.sectorRotation ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Lihat sektor yang sedang menguat/melemah untuk membantu pemilihan saham berbasis sektor.
          </p>

          {sectorRotation && (
            <div
              style={{
                marginTop: '0.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {[...(sectorRotation.hot_sectors || []), ...(sectorRotation.cold_sectors || [])].map(
                (s) => (
                  <div
                    key={s.sector_id}
                    className="glass-card"
                    style={{
                      padding: '0.9rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.sector_name}</div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          Momentum {s.momentum_score} • {s.status}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {s.recommendation}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Rata-rata hari ini</span>
                      <span style={{ fontWeight: 600 }}>
                        {s.avg_return_today.toFixed(2)}%
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Value</span>
                      <span style={{ fontWeight: 600 }}>{s.total_value_formatted}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


