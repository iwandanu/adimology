'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppUser } from '@/app/components/UserProvider';
import ConnectRequiredCard from '@/app/components/ConnectRequiredCard';
import { ADMIN_EMAIL } from '@/lib/config';

interface UserQueryRow {
  id: number;
  emiten: string;
  from_date: string | null;
  to_date: string | null;
  created_at: string;
  source: string | null;
  user_id: string;
}

export default function SearchHistoryPage() {
  const { user, loading } = useAppUser();
  const [rows, setRows] = useState<UserQueryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [filterTicker, setFilterTicker] = useState('');

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingRows(true);
      setError(null);
      try {
        const query = supabase
          .from('user_stock_queries')
          .select('id, emiten, from_date, to_date, created_at, source, user_id')
          .order('created_at', { ascending: false })
          .limit(200);

        const { data, error } = await (isAdmin
          ? query
          : query.eq('user_id', user.id));

        if (error) {
          console.error('load search history error:', error);
          setError('Gagal memuat riwayat pencarian.');
          return;
        }

        setRows((data as UserQueryRow[]) || []);
      } finally {
        setLoadingRows(false);
      }
    };
    load();
  }, [user?.id, isAdmin]);

  const filteredRows = useMemo(() => {
    const ticker = filterTicker.trim().toUpperCase();
    if (!ticker) return rows;
    return rows.filter((r) => (r.emiten || '').toUpperCase().includes(ticker));
  }, [rows, filterTicker]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Memuat sesi pengguna...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <ConnectRequiredCard message="Silakan Connect Google untuk melihat riwayat pencarian emiten Anda." />
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <h1 className="page-title">Search History</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Riwayat pencarian emiten yang Anda lakukan melalui kalkulator Adimology.
        </p>

        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Riwayat Pencarian</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isAdmin
                  ? 'Anda melihat riwayat untuk semua user. Gunakan Admin Dashboard untuk filter lanjut per user.'
                  : 'Hanya menampilkan riwayat pencarian milik akun Anda.'}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
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
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredRows.length} entries
              </span>
            </div>
          </div>

          {loadingRows ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Memuat riwayat pencarian...
            </div>
          ) : error ? (
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(248, 113, 113, 0.7)',
                background: 'rgba(248, 113, 113, 0.08)',
                color: '#f87171',
                fontSize: '0.8rem',
              }}
            >
              {error}
            </div>
          ) : (
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
                      Date Range
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
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      Sumber
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Belum ada riwayat pencarian yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600 }}>
                          <a
                            href={`/?symbol=${encodeURIComponent(row.emiten)}`}
                            style={{
                              color: 'var(--accent-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {row.emiten}
                          </a>
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {row.from_date || row.to_date
                            ? `${row.from_date || '?'} → ${row.to_date || '?'}`
                            : '—'}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)' }}>
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString('id-ID', {
                                dateStyle: 'short',
                                timeStyle: 'medium',
                              })
                            : '—'}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)' }}>
                          {row.source || 'calculator'}
                        </td>
                      </tr>
                    ))
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

