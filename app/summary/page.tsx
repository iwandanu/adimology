'use client';

import { useEffect, useState } from 'react';
import { useAppUser } from '../components/UserProvider';
import { ADMIN_EMAIL } from '@/lib/config';

interface UsageSummary {
  userCount: number;
  totalQueries: number;
  usersWithQueries: number;
  topTickers: { emiten: string; count: number }[];
}

export default function SummaryPage() {
  const { user, loading } = useAppUser();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

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

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Memuat sesi pengguna...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            fontSize: '0.9rem',
            maxWidth: '480px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          Halaman Summary hanya tersedia untuk admin.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 className="page-title">Summary</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Ringkasan aktivitas pencarian: jumlah user, total query, dan emiten yang paling sering
        dicari.
      </p>

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
    </div>
  );
}
