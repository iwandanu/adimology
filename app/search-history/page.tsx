'use client';

import { useState, useEffect } from 'react';
import { useAppUser } from '../components/UserProvider';
import ConnectRequiredCard from '../components/ConnectRequiredCard';
import { ADMIN_EMAIL } from '@/lib/config';

interface AnalysisRecord {
  id: number;
  from_date: string;
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;
  arb?: number;
  target_realistis?: number;
  target_max?: number;
  real_harga?: number;
  max_harga?: number;
  status: string;
  error_message?: string;
}

export default function SearchHistoryPage() {
  const { user, loading } = useAppUser();
  const [data, setData] = useState<AnalysisRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filters, setFilters] = useState({
    emiten: '',
    sector: 'all',
    fromDate: '',
    toDate: '',
    status: 'all'
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ column: 'from_date', direction: 'desc' });
  const [sectors, setSectors] = useState<string[]>([]);
  const pageSize = 50;

  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [filters, page, sort, user]);

  const fetchSectors = async () => {
    try {
      const response = await fetch('/api/sectors');
      const json = await response.json();
      if (json.success) {
        setSectors(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        userId: user.id,
        isAdmin: isAdmin.toString(),
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });

      if (filters.emiten) params.append('emiten', filters.emiten);
      if (filters.sector !== 'all') params.append('sector', filters.sector);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);

      const response = await fetch(`/api/user-history?${params}`);
      const json = await response.json();

      if (json.success) {
        setData(json.data || []);
        setTotalCount(json.count || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatNumber = (num?: number) => num?.toLocaleString() ?? '-';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).replace(' ', '-');
  };

  const calculateGain = (price: number | undefined, target: number | undefined) => {
    if (!price || !target || price === 0) return null;
    const gain = ((target - price) / price) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;
  };

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
        <ConnectRequiredCard message="Silakan Connect Google untuk melihat riwayat analisis Anda." />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 className="page-title">Search History</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Riwayat hasil analisis emiten yang Anda lakukan melalui kalkulator Adimology.
      </p>

      <div className="glass-card-static">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>📊 Riwayat Analisis Anda</h2>
          <button
            className="solid-btn"
            onClick={fetchHistory}
            style={{ 
              padding: '0 1.25rem', 
              fontSize: '0.8rem',
              fontWeight: '700',
              borderRadius: '8px',
              background: '#4b5563',
              color: 'white',
              border: '1px solid #4b5563',
              cursor: 'pointer',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(75, 85, 99, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="input-label compact-label">Emiten</label>
            <input
              type="text"
              className="input-field compact-input"
              placeholder="e.g., BBCA"
              value={filters.emiten}
              onChange={(e) => {
                setFilters({ ...filters, emiten: e.target.value.toUpperCase() });
                setPage(0);
              }}
            />
          </div>

          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="input-label compact-label">From Date</label>
            <input
              type="date"
              className="input-field compact-input"
              value={filters.fromDate}
              onChange={(e) => {
                setFilters({ ...filters, fromDate: e.target.value });
                setPage(0);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
            />
          </div>

          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="input-label compact-label">To Date</label>
            <input
              type="date"
              className="input-field compact-input"
              value={filters.toDate}
              onChange={(e) => {
                setFilters({ ...filters, toDate: e.target.value });
                setPage(0);
              }}
              onClick={(e) => e.currentTarget.showPicker()}
            />
          </div>

          <div className="input-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <label className="input-label compact-label">Status</label>
            <select
              className="input-field compact-input"
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(0);
              }}
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="input-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            <label className="input-label compact-label">Sector</label>
            <select
              className="input-field compact-input"
              value={filters.sector}
              onChange={(e) => {
                setFilters({ ...filters, sector: e.target.value });
                setPage(0);
              }}
            >
              <option value="all">All Sectors</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            Tidak ada data yang sesuai dengan filter Anda.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    <th
                      style={{ whiteSpace: 'nowrap', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => {
                        const direction = sort.column === 'from_date' && sort.direction === 'desc' ? 'asc' : 'desc';
                        setSort({ column: 'from_date', direction });
                      }}
                    >
                      Date {sort.column === 'from_date' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th
                      style={{ whiteSpace: 'nowrap', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => {
                        const direction = sort.column === 'emiten' && sort.direction === 'asc' ? 'desc' : 'asc';
                        setSort({ column: 'emiten', direction });
                      }}
                    >
                      Emiten {sort.column === 'emiten' ? (sort.direction === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Harga</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target R1</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Max</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Max Harga</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Close Harga</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bandar</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vol Bandar</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Bandar</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((record, index) => (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: index < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>{formatDate(record.from_date)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <a
                          href={`/?symbol=${encodeURIComponent(record.emiten)}`}
                          style={{
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                          }}
                        >
                          {record.emiten}
                        </a>
                        {record.sector && (
                          <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
                            {record.sector}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>
                        {formatNumber(record.harga)}
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem', color: 'var(--accent-success)' }}>
                          {formatNumber(record.target_realistis)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {calculateGain(record.harga, record.target_realistis)}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem', color: 'var(--accent-warning)' }}>
                          {formatNumber(record.target_max)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {calculateGain(record.harga, record.target_max)}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        {record.max_harga ? (
                          <>
                            <div style={{
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.95rem',
                              color: record.target_max && record.max_harga >= record.target_max
                                ? 'var(--accent-warning)'
                                : (record.target_realistis && record.max_harga >= record.target_realistis
                                  ? 'var(--accent-success)'
                                  : (record.harga && record.max_harga > record.harga
                                    ? '#F59E0B'
                                    : 'var(--text-primary)'))
                            }}>
                              {formatNumber(record.max_harga)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {calculateGain(record.harga, record.max_harga)}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        {record.real_harga ? (
                          <>
                            <div style={{
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.95rem',
                              color: record.target_max && record.real_harga >= record.target_max
                                ? 'var(--accent-warning)'
                                : (record.target_realistis && record.real_harga >= record.target_realistis
                                  ? 'var(--accent-success)'
                                  : (record.harga && record.real_harga > record.harga
                                    ? '#F59E0B'
                                    : 'var(--text-primary)'))
                            }}>
                              {formatNumber(record.real_harga)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {calculateGain(record.harga, record.real_harga)}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{record.bandar || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>
                        {formatNumber(record.barang_bandar)}
                      </td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.95rem' }}>
                          {formatNumber(record.rata_rata_bandar)}
                        </div>
                        {record.rata_rata_bandar && record.harga && record.rata_rata_bandar < record.harga && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {calculateGain(record.rata_rata_bandar, record.harga)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {record.status === 'success' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(56, 239, 125, 0.1)',
                            color: 'var(--accent-success)'
                          }}>
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(245, 87, 108, 0.1)',
                              color: 'var(--accent-warning)',
                              cursor: 'pointer'
                            }}
                            title={record.error_message}
                          >
                            ✕
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} records
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    padding: '0.5rem 1rem'
                  }}
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: (page + 1) * pageSize >= totalCount ? 'var(--text-muted)' : 'var(--text-primary)',
                    padding: '0.5rem 1rem'
                  }}
                  disabled={(page + 1) * pageSize >= totalCount}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

