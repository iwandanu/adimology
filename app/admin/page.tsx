'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppUser } from '@/app/components/UserProvider';
import { ADMIN_EMAIL } from '@/lib/config';

interface UsageSummary {
  userCount: number;
  totalQueries: number;
  usersWithQueries: number;
  topTickers: { emiten: string; count: number }[];
}

interface QueryLogItem {
  id: number;
  emiten: string;
  created_at: string;
  user_id: string;
  email: string | null;
}

export default function AdminPage() {
  const { user, loading } = useAppUser();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [queryLog, setQueryLog] = useState<QueryLogItem[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [filterTicker, setFilterTicker] = useState('');
  const [filterUser, setFilterUser] = useState('');

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

  useEffect(() => {
    if (!isAdmin) return;
    const loadLog = async () => {
      setLogLoading(true);
      setLogError(null);
      try {
        const res = await fetch('/api/admin/query-log');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load query log');
        setQueryLog((json.data as QueryLogItem[]) || []);
      } catch (e) {
        setLogError(e instanceof Error ? e.message : 'Failed to load query log');
      } finally {
        setLogLoading(false);
      }
    };
    loadLog();
  }, [isAdmin]);

  const filteredLog = useMemo(() => {
    const ticker = filterTicker.trim().toUpperCase();
    const userFilter = filterUser.trim().toLowerCase();
    return queryLog.filter((item) => {
      const tickerMatch = ticker
        ? (item.emiten || '').toUpperCase().includes(ticker)
        : true;
      const email = item.email || '';
      const userMatch = userFilter ? email.toLowerCase().includes(userFilter) : true;
      return tickerMatch && userMatch;
    });
  }, [queryLog, filterTicker, filterUser]);

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

            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Detail Pencarian (Query Log)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Daftar maksimal 500 pencarian terakhir: emiten, user, dan waktu pencarian.
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    minWidth: '220px',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Filter ticker (e.g. BBCA)"
                    value={filterTicker}
                    onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
                    style={{
                      minWidth: '150px',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filter user email"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    style={{
                      minWidth: '180px',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filteredLog.length} rows
                  </span>
                </div>
              </div>

              {logError && (
                <div
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(248, 113, 113, 0.7)',
                    background: 'rgba(248, 113, 113, 0.08)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                  }}
                >
                  {logError}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        Ticker
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        User
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.75rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        Waktu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logLoading && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Memuat query log...
                        </td>
                      </tr>
                    )}
                    {!logLoading && filteredLog.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            padding: '1rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Belum ada data query yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                    {!logLoading &&
                      filteredLog.map((row) => (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                          }}
                        >
                          <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}>
                            {row.emiten}
                          </td>
                          <td
                            style={{
                              padding: '0.45rem 0.75rem',
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={row.email || undefined}
                          >
                            {row.email || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)' }}>
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString('id-ID', {
                                  dateStyle: 'short',
                                  timeStyle: 'medium',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

