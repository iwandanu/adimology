'use client';

import { useEffect, useState } from 'react';
import { useAppUser } from '@/app/components/UserProvider';

interface UsageSummary {
  userCount: number;
  totalQueries: number;
  usersWithQueries: number;
  topTickers: { emiten: string; count: number }[];
}

export default function AdminPage() {
  const { user, loading } = useAppUser();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isAdmin = !!user?.email && user.email.toLowerCase() === 'dimasiwandanu@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoadingStats(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/usage-summary');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load usage summary');
        setSummary(json.data as UsageSummary);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load usage summary');
      } finally {
        setLoadingStats(false);
      }
    };
    load();
  }, [isAdmin]);

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Ringkasan pemakaian Adimology: jumlah user, aktivitas query, dan emiten yang paling sering
          dianalisis.
        </p>

        {loading || (!user && !loading) ? (
          <div className="glass-card" style={{ padding: '1.25rem', fontSize: '0.9rem' }}>
            {loading ? 'Memuat sesi pengguna…' : 'Silakan Connect Google terlebih dahulu.'}
          </div>
        ) : null}

        {!loading && user && !isAdmin && (
          <div
            className="glass-card"
            style={{
              padding: '1.25rem',
              fontSize: '0.9rem',
              borderColor: 'rgba(245, 158, 11, 0.7)',
              background: 'rgba(245, 158, 11, 0.08)',
              color: '#f59e0b',
            }}
          >
            Akun ini tidak memiliki akses admin. Hubungi owner untuk pengaturan lebih lanjut.
          </div>
        )}

        {isAdmin && (
          <>
            {error && (
              <div
                className="glass-card"
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderColor: 'rgba(248, 113, 113, 0.7)',
                  background: 'rgba(248, 113, 113, 0.08)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div
              className="glass-card"
              style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Registered Users
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  {summary ? summary.userCount : loadingStats ? '…' : 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Total Queries (sampled)
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  {summary ? summary.totalQueries : loadingStats ? '…' : 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Dari maksimal 500 query terakhir.
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Active Users (with queries)
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  {summary ? summary.usersWithQueries : loadingStats ? '…' : 0}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <h3 style={{ fontSize: '0.95rem' }}>Top Tickers by Query Count</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSummary(null);
                    setError(null);
                    setLoadingStats(true);
                    fetch('/api/admin/usage-summary')
                      .then((r) => r.json())
                      .then((json) => {
                        if (!json.success) throw new Error(json.error || 'Failed to reload');
                        setSummary(json.data as UsageSummary);
                      })
                      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to reload'))
                      .finally(() => setLoadingStats(false));
                  }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {loadingStats ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {summary && summary.topTickers.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {summary.topTickers.map((t) => (
                    <div
                      key={t.emiten}
                      style={{
                        padding: '0.8rem',
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
                        <span style={{ fontWeight: 600 }}>{t.emiten}</span>
                        <span style={{ fontWeight: 600 }}>{t.count}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Jumlah query yang tercatat.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Belum ada data query yang cukup untuk ditampilkan.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

