/* Retail Opportunity dashboard using Datasaham Retail endpoints:
 * - /api/retail/multibagger
 * - /api/retail/breakout-alerts
 * - /api/retail/risk-reward?symbol=XXX
 * - /api/retail/sector-rotation
 */
'use client';

import { useEffect, useState } from 'react';

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

interface RiskRewardTarget {
  level: number;
  probability: number;
  reward: number;
  risk_reward: number;
}

interface RiskRewardPayload {
  symbol: string;
  name: string;
  current_price: number;
  stop_loss_recommended: number;
  target_prices: RiskRewardTarget[];
  risk_reward_ratio: number;
  recommendation: string;
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
  const [multibagger, setMultibagger] = useState<MultibaggerPayload | null>(null);
  const [breakouts, setBreakouts] = useState<BreakoutPayload | null>(null);
  const [riskSymbol, setRiskSymbol] = useState('BBRI');
  const [riskReward, setRiskReward] = useState<RiskRewardPayload | null>(null);
  const [sectorRotation, setSectorRotation] = useState<SectorRotationPayload | null>(null);
  const [loading, setLoading] = useState({
    multibagger: false,
    breakouts: false,
    riskReward: false,
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

  const loadRiskReward = async () => {
    if (!riskSymbol.trim()) return;
    try {
      setLoading((s) => ({ ...s, riskReward: true }));
      const res = await fetch(`/api/retail/risk-reward?symbol=${encodeURIComponent(riskSymbol)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load risk-reward');
      const payload = (json.data as { data?: RiskRewardPayload })?.data ?? json.data;
      setRiskReward(payload as RiskRewardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load risk-reward');
    } finally {
      setLoading((s) => ({ ...s, riskReward: false }));
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
              className="btn-primary"
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
            <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Nama</th>
                    <th>Score</th>
                    <th>Return</th>
                    <th>Timeframe</th>
                    <th>Harga</th>
                    <th>Entry Zone</th>
                    <th>Risk</th>
                    <th>Sektor</th>
                  </tr>
                </thead>
                <tbody>
                  {multibagger.candidates.map((c) => (
                    <tr key={c.symbol}>
                      <td>{c.symbol}</td>
                      <td>{c.name}</td>
                      <td>{c.multibagger_score}</td>
                      <td>{c.potential_return}</td>
                      <td>{c.timeframe}</td>
                      <td>Rp {c.current_price.toLocaleString('id-ID')}</td>
                      <td>
                        {c.entry_zone
                          ? `Rp ${c.entry_zone.ideal_price.toLocaleString(
                              'id-ID'
                            )} - Rp ${c.entry_zone.max_price.toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td>{c.risk_level}</td>
                      <td>{c.sector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              className="btn-primary"
            >
              {loading.breakouts ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Alert breakout volume/harga untuk saham dengan peluang kelanjutan trend kuat.
          </p>

          {breakouts && (
            <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Nama</th>
                    <th>Tipe</th>
                    <th>Sev</th>
                    <th>Harga</th>
                    <th>Δ %</th>
                    <th>Volume</th>
                    <th>Vol vs Avg</th>
                    <th>Prob.</th>
                    <th>Aksi</th>
                    <th>Target</th>
                    <th>SL</th>
                  </tr>
                </thead>
                <tbody>
                  {breakouts.alerts.map((a) => (
                    <tr key={`${a.symbol}-${a.alert_type}-${a.price}`}>
                      <td>{a.symbol}</td>
                      <td>{a.name}</td>
                      <td>{a.alert_type.replace(/_/g, ' ')}</td>
                      <td>{a.severity}</td>
                      <td>Rp {a.price.toLocaleString('id-ID')}</td>
                      <td>{a.change_percentage.toFixed(2)}</td>
                      <td>{a.volume}</td>
                      <td>{a.volume_vs_avg.toFixed(1)}x</td>
                      <td>{a.breakout_probability}%</td>
                      <td>{a.action}</td>
                      <td>Rp {a.target.toLocaleString('id-ID')}</td>
                      <td>Rp {a.stop_loss.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Risk-Reward per symbol */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.75rem',
            }}
          >
            <h3>Risk-Reward per Saham</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                value={riskSymbol}
                onChange={(e) => setRiskSymbol(e.target.value.toUpperCase())}
                placeholder="Contoh: BBRI"
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  width: '110px',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="button"
                onClick={loadRiskReward}
                disabled={loading.riskReward || !riskSymbol.trim()}
                className="btn-primary"
              >
                {loading.riskReward ? 'Loading...' : 'Analyze'}
              </button>
            </div>
          </div>

          {riskReward && (
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Ringkasan</h4>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Harga sekarang: Rp {riskReward.current_price.toLocaleString('id-ID')}
                </p>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Stop loss rekomendasi: Rp{' '}
                  {riskReward.stop_loss_recommended.toLocaleString('id-ID')}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Risk/Reward ratio: {riskReward.risk_reward_ratio.toFixed(2)} (
                  {riskReward.recommendation})
                </p>
              </div>

              <div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Target Price</h4>
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Prob.</th>
                      <th>Reward %</th>
                      <th>RR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskReward.target_prices.map((t, idx) => (
                      <tr key={idx}>
                        <td>Rp {t.level.toLocaleString('id-ID')}</td>
                        <td>{t.probability}%</td>
                        <td>{t.reward.toFixed(2)}</td>
                        <td>{t.risk_reward.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              className="btn-primary"
            >
              {loading.sectorRotation ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Lihat sektor yang sedang menguat/melemah untuk membantu pemilihan saham berbasis sektor.
          </p>

          {sectorRotation && (
            <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Sektor</th>
                    <th>Momentum</th>
                    <th>Status</th>
                    <th>Rata-rata % Hari Ini</th>
                    <th>Value</th>
                    <th>Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(sectorRotation.hot_sectors || []), ...(sectorRotation.cold_sectors || [])].map(
                    (s) => (
                      <tr key={s.sector_id}>
                        <td>{s.sector_name}</td>
                        <td>{s.momentum_score}</td>
                        <td>{s.status}</td>
                        <td>{s.avg_return_today.toFixed(2)}%</td>
                        <td>{s.total_value_formatted}</td>
                        <td>{s.recommendation}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


