'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PRESETS = [
  { id: 'oversold', label: 'Oversold (RSI < 30)', desc: 'Saham oversold, potensi反弹' },
  { id: 'overbought', label: 'Overbought (RSI > 70)', desc: 'Saham overbought, hati-hati' },
  { id: 'bullish', label: 'Bullish', desc: 'MACD bullish + harga di atas SMA20' },
  { id: 'bearish', label: 'Bearish', desc: 'MACD bearish + harga di bawah SMA20' },
  { id: 'momentum', label: 'Momentum', desc: 'RSI 50-70 + MACD bullish' },
  { id: 'breakout', label: 'Breakout', desc: 'Dekat resistance + volume spike' },
  { id: 'undervalued', label: 'Undervalued', desc: 'RSI rendah, potensi value' },
] as const;

const UNIVERSES = [
  { id: 'lq45', label: 'LQ45', count: 45 },
  { id: 'idx80', label: 'IDX80', count: 80 },
  { id: 'popular', label: 'Popular', count: 40 },
];

export default function ScreenPage() {
  const router = useRouter();
  const [preset, setPreset] = useState<string>('oversold');
  const [universe, setUniverse] = useState<string>('lq45');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    stocks: { emiten: string; price: number; rsi: number | null; signal: string; score: number }[];
    count: number;
  } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResults(null);
    setProgress(null);

    try {
      const res = await fetch(
        `/api/screen?preset=${preset}&universe=${universe}`
      );
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      setResults({
        stocks: json.data.stocks,
        count: json.data.count,
      });
    } catch (err) {
      console.error(err);
      setResults({ stocks: [], count: 0 });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Stock Screener</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Filter saham berdasarkan kriteria teknikal (RSI, MACD, Trend)
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Preset</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border:
                    preset === p.id
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-color)',
                  background: preset === p.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {p.desc}
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Universe
            </label>
            <select
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                minWidth: '140px',
              }}
            >
              {UNIVERSES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.count} saham)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Scanning...' : 'Run Screener'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p>Menganalisis saham... Ini mungkin memakan waktu 1-2 menit.</p>
          </div>
        )}

        {results && !loading && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3>
              Hasil: {results.count} saham {PRESETS.find((p) => p.id === preset)?.label}
            </h3>

            {results.stocks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                Tidak ada saham yang memenuhi kriteria.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                {results.stocks.map((s) => (
                  <button
                    key={s.emiten}
                    type="button"
                    onClick={() => router.push(`/?symbol=${s.emiten}`)}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.emiten}</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                      Rp {s.price.toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      RSI: {s.rsi != null ? s.rsi.toFixed(1) : '-'} | {s.signal}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
