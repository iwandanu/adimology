'use client';

import type { TechnicalAnalysisResult } from '@/lib/technical';

interface TechnicalAnalysisCardProps {
  emiten: string;
  data: TechnicalAnalysisResult & { currentPrice?: number };
  loading?: boolean;
}

export default function TechnicalAnalysisCard({ emiten, data, loading }: TechnicalAnalysisCardProps) {
  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-';

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="card-title">📊 Technical Analysis</h3>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
    );
  }

  const signalColor =
    data.signal === 'buy'
      ? 'var(--accent-success)'
      : data.signal === 'sell'
        ? 'var(--accent-warning)'
        : 'var(--text-muted)';

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 className="card-title">📊 Technical Analysis — {emiten}</h3>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {/* RSI */}
        <div className="compact-section">
          <div className="compact-section-title">RSI (14)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color:
                  data.rsiSignal === 'oversold'
                    ? 'var(--accent-success)'
                    : data.rsiSignal === 'overbought'
                      ? 'var(--accent-warning)'
                      : 'var(--text-primary)',
              }}
            >
              {fmt(data.rsi)}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '8px',
                background:
                  data.rsiSignal === 'oversold'
                    ? 'rgba(56, 239, 125, 0.2)'
                    : data.rsiSignal === 'overbought'
                      ? 'rgba(245, 87, 108, 0.2)'
                      : 'rgba(255,255,255,0.08)',
                textTransform: 'capitalize',
              }}
            >
              {data.rsiSignal}
            </span>
          </div>
        </div>

        {/* MACD */}
        {data.macd && (
          <div className="compact-section">
            <div className="compact-section-title">MACD</div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>MACD: {fmt(data.macd.macd)}</span>
              <span>Signal: {fmt(data.macd.signal)}</span>
              <span
                style={{
                  color:
                    data.macdSignal === 'bullish'
                      ? 'var(--accent-success)'
                      : data.macdSignal === 'bearish'
                        ? 'var(--accent-warning)'
                        : 'var(--text-muted)',
                }}
              >
                {data.macdSignal}
              </span>
            </div>
          </div>
        )}

        {/* SMA */}
        <div className="compact-section">
          <div className="compact-section-title">Moving Averages</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <div>
              <span className="compact-label">SMA 20</span>
              <div className="compact-value">{fmt(data.sma20)}</div>
            </div>
            <div>
              <span className="compact-label">SMA 50</span>
              <div className="compact-value">{fmt(data.sma50)}</div>
            </div>
            <div>
              <span className="compact-label">SMA 200</span>
              <div className="compact-value">{fmt(data.sma200)}</div>
            </div>
          </div>
        </div>

        {/* Bollinger */}
        {data.bollinger && (
          <div className="compact-section">
            <div className="compact-section-title">Bollinger Bands</div>
            <div style={{ fontSize: '0.85rem' }}>
              Upper: {fmt(data.bollinger.upper)} | Middle: {fmt(data.bollinger.middle)} | Lower:{' '}
              {fmt(data.bollinger.lower)}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              Price vs BB: {data.priceVsBB}
            </span>
          </div>
        )}

        {/* Support / Resistance */}
        {(data.support != null || data.resistance != null) && (
          <div className="compact-section">
            <div className="compact-section-title">Support / Resistance</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span>Support: Rp {fmt(data.support)}</span>
              <span>Resistance: Rp {fmt(data.resistance)}</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: `1px solid ${signalColor}40`,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Trend</div>
            <div style={{ textTransform: 'capitalize', fontWeight: 600 }}>{data.trend}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Signal</div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: signalColor,
                textTransform: 'uppercase',
              }}
            >
              {data.signal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
