'use client';

import { useState } from 'react';

type MultiMarketPayload = Record<string, any>;

const COMMODITY_OPTIONS = [
  'Coal',
  'Oil',
  'Gold',
  'Nickel',
  'CPO',
  'Tin',
  'Copper',
];

export default function MultiMarketScreenerPage() {
  const [commodityExposure, setCommodityExposure] = useState<string[]>(['Coal', 'Oil']);
  const [forexExposure, setForexExposure] = useState<'all' | 'exporter' | 'importer'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minVolume, setMinVolume] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MultiMarketPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleCommodity = (name: string) => {
    setCommodityExposure((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams();
    if (commodityExposure.length > 0) {
      params.set('commodityExposure', commodityExposure.join(','));
    }
    if (forexExposure && forexExposure !== 'all') {
      params.set('forexExposure', forexExposure);
    }
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minVolume) params.set('minVolume', minVolume);

    try {
      const res = await fetch(`/api/advanced/multi-market-screener?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch screener data');
      setData(json.data as MultiMarketPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch screener data');
    } finally {
      setLoading(false);
    }
  };

  const stocks: any[] =
    (Array.isArray((data as any)?.stocks) && (data as any).stocks) ||
    (Array.isArray((data as any)?.results) && (data as any).results) ||
    (Array.isArray((data as any)?.data?.stocks) && (data as any).data.stocks) ||
    [];

  const globalContext = (data as any)?.global || (data as any)?.context;

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Multi Market Screener</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Screen saham IDX berdasarkan eksposur terhadap komoditas dan forex menggunakan Datasaham
          Multi-Market Screener. Lihat dokumentasi di{' '}
          <a
            href="https://api.datasaham.io/swagger#tag/advanced-analytics/GET/api/analysis/screener/multi-market"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent-primary)' }}
          >
            Datasaham Multi-Market Screener
          </a>
          .
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Filter</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr)',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Commodity Exposure
                </span>
                <button
                  type="button"
                  onClick={() => setCommodityExposure([])}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                >
                  clear
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {COMMODITY_OPTIONS.map((c) => {
                  const active = commodityExposure.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleToggleCommodity(c)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        border: active
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-color)',
                        background: active
                          ? 'rgba(124, 58, 237, 0.15)'
                          : 'rgba(255,255,255,0.02)',
                        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Forex Exposure
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'exporter', label: 'Exporter (diuntungkan USD menguat)' },
                  { id: 'importer', label: 'Importer (diuntungkan IDR menguat)' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="forexExposure"
                      value={opt.id}
                      checked={forexExposure === opt.id}
                      onChange={() => setForexExposure(opt.id as any)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span
                  style={{
                    display: 'block',
                    marginBottom: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Price (Rp)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    marginBottom: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Min Volume
                </span>
                <input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={minVolume}
                  onChange={(e) => setMinVolume(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleRun}
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: '0.25rem', height: '36px' }}
              >
                {loading ? 'Scanning...' : 'Run Screener'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="glass-card"
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderColor: 'rgba(245, 87, 108, 0.6)',
              background: 'rgba(245, 87, 108, 0.08)',
              color: '#f5576c',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </div>
        )}

        {globalContext && (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Global Context</h3>
            <pre
              style={{
                margin: 0,
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.35)',
                fontSize: '0.7rem',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(globalContext, null, 2)}
            </pre>
          </div>
        )}

        {stocks.length > 0 && (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>
              Hasil Screener ({stocks.length} saham)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {stocks.map((s, idx) => (
                <div
                  key={s.symbol || s.code || idx}
                  className="glass-card"
                  style={{
                    padding: '0.9rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        {s.symbol || s.code}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        {s.name || s.company_name || '-'}
                      </div>
                    </div>
                    {s.score != null && (
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
                        Score {s.score}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>Harga</span>
                    <span style={{ fontWeight: 600 }}>
                      {s.price != null
                        ? `Rp ${Number(s.price).toLocaleString('id-ID')}`
                        : s.price_formatted || '-'}
                    </span>
                  </div>

                  {s.forex_impact && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Forex Impact</span>
                      <span style={{ fontWeight: 600 }}>{s.forex_impact}</span>
                    </div>
                  )}

                  {s.commodity_impact && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>Commodity Impact</span>
                      <span style={{ fontWeight: 600 }}>{s.commodity_impact}</span>
                    </div>
                  )}

                  {s.notes && (
                    <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                      {s.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

