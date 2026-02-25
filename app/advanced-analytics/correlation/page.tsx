'use client';

import { useState } from 'react';
import { useAppUser } from '@/app/components/UserProvider';

type CorrelationPayload = Record<string, any>;

export default function CorrelationAnalysisPage() {
  const [symbols, setSymbols] = useState('BBCA,BBRI,BMRI,TLKM');
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CorrelationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppUser();

  const handleRun = async () => {
    if (!symbols.trim()) return;

    if (!user) {
      setError('Silakan Connect Google (kanan atas) untuk menggunakan Advanced Analytics.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams();
    params.set('symbols', symbols.replace(/\s+/g, ''));
    if (periodDays) params.set('period_days', String(periodDays));

    try {
      const res = await fetch(`/api/advanced/correlation?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch correlation');
      setData(json.data as CorrelationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch correlation');
    } finally {
      setLoading(false);
    }
  };

  const pairs: any[] =
    (Array.isArray((data as any)?.pairs) && (data as any).pairs) ||
    (Array.isArray((data as any)?.insights?.top_pairs) && (data as any).insights.top_pairs) ||
    [];

  const matrix = (data as any)?.matrix;

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Correlation Analysis</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Menggunakan endpoint Correlation Matrix dari Datasaham.io untuk menghitung korelasi harga
          antar saham. Lihat dokumentasi di{' '}
          <a
            href="https://api.datasaham.io/swagger#tag/advanced-analytics/GET/api/analysis/correlation"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--accent-primary)' }}
          >
            Datasaham Correlation API
          </a>
          .
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Input</h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Symbols (comma-separated)
              </label>
              <input
                type="text"
                value={symbols}
                onChange={(e) => setSymbols(e.target.value.toUpperCase())}
                placeholder="BBCA,BBRI,BMRI,TLKM"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div style={{ width: '160px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Period (days)
              </label>
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              >
                {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                  <option key={d} value={d}>
                    {d} hari
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={loading || !symbols.trim()}
              className="btn-primary"
              style={{ height: '36px', paddingInline: '1.25rem' }}
            >
              {loading ? 'Calculating...' : 'Run Correlation'}
            </button>
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

        {data && (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Correlation Result</h3>
            {pairs.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Top Pairs</h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {pairs.slice(0, 8).map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
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
                        <span style={{ fontWeight: 600 }}>
                          {p.symbol1 || p.a} / {p.symbol2 || p.b}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {(p.correlation ?? p.value ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {p.strength || p.bucket || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matrix && (
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Correlation Matrix</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="compact-table">
                    <thead>
                      <tr>
                        <th></th>
                        {Object.keys(matrix).map((sym) => (
                          <th key={sym}>{sym}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries<any>(matrix).map(([rowSym, rowVals]) => (
                        <tr key={rowSym}>
                          <td style={{ fontWeight: 600 }}>{rowSym}</td>
                          {Object.keys(matrix).map((colSym) => {
                            const v = rowVals[colSym];
                            const num = typeof v === 'number' ? v : Number(v ?? 0);
                            return <td key={colSym}>{num.toFixed(2)}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!matrix && pairs.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tidak ada data korelasi terstruktur yang bisa ditampilkan. Coba cek tab &quot;Raw
                JSON&quot; di devtools atau periksa parameter input.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

