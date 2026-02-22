'use client';

import { useState, useEffect, useRef } from 'react';
import type { BrakotBrekotResult } from '@/lib/types';
import { renderWithLinks } from '@/lib/utils';

interface BrakotBrekotCardProps {
  analyses: BrakotBrekotResult[];
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  onRetry?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  'PRE-MARKUP': 'var(--accent-success)',
  SIAP: 'var(--accent-primary)',
  WATCHLIST: '#f59e0b',
  ABAIKAN: 'var(--text-muted)',
};

export default function BrakotBrekotCard({ analyses, status, onRetry }: BrakotBrekotCardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (analyses.length > 0) {
      if (!selectedId) setSelectedId(analyses[0].id || null);
      if (prevStatusRef.current !== 'completed' && status === 'completed') {
        setSelectedId(analyses[0].id || null);
      }
    }
    prevStatusRef.current = status;
  }, [analyses, status, selectedId]);

  const data = analyses.find((a) => a.id === selectedId) || analyses[0];

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          {status === 'pending' ? 'Memulai BrakotBrekot...' : 'AI menganalisis Smart Money & Teknikal...'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Proses membutuhkan waktu beberapa menit
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--accent-warning)' }}>
        <p style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }}>
          ❌ {analyses[0]?.error_message || 'Gagal menganalisis BrakotBrekot'}
        </p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            🔄 Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if ((!analyses || analyses.length === 0) && status === 'idle') return null;

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>📊</span>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          BrakotBrekot (Smart Money & Teknikal)
        </h3>

        {analyses.length > 1 && (
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {analyses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.created_at
                  ? new Date(a.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </option>
            ))}
          </select>
        )}

        {analyses.length <= 1 && data?.created_at && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {new Date(data.created_at).toLocaleDateString('id-ID')}
          </span>
        )}
      </div>

      {/* Summary: Skor & Status */}
      {data.total_skor != null && data.status_final && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Total Skor
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data.total_skor}/100
            </div>
          </div>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: `${STATUS_COLORS[data.status_final] || 'var(--accent-primary)'}22`,
              border: `1px solid ${STATUS_COLORS[data.status_final] || 'var(--accent-primary)'}`,
              color: STATUS_COLORS[data.status_final] || 'var(--accent-primary)',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            {data.status_final}
          </div>
        </div>
      )}

      {/* Fase & Pola */}
      {(data.fase_saat_ini || (data.pola_terdeteksi && data.pola_terdeteksi.length > 0)) && (
        <div style={{ marginBottom: '1.5rem' }}>
          {data.fase_saat_ini && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fase Saat Ini: </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{data.fase_saat_ini}</span>
            </div>
          )}
          {data.pola_terdeteksi && data.pola_terdeteksi.length > 0 && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pola: </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {data.pola_terdeteksi.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(124, 58, 237, 0.15)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rincian Skor */}
      {data.rincian_skor && Object.keys(data.rincian_skor).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 500 }}>
            Rincian Skor
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(data.rincian_skor).map(([key, val]) => {
              if (!val || typeof val !== 'object') return null;
              const v = val as { nilai?: number; maks?: number; alasan?: string };
              const label = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div
                  key={key}
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {(v.nilai ?? 0)}/{v.maks ?? 0}
                    </span>
                  </div>
                  {v.alasan && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {renderWithLinks(v.alasan)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kesimpulan & Trading Plan */}
      {data.kesimpulan_trading_plan && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Kesimpulan & Trading Plan:</span>
          <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {renderWithLinks(data.kesimpulan_trading_plan)}
          </div>
        </div>
      )}
    </div>
  );
}
