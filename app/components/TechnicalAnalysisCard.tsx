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
      <div className="compact-style-card">
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Technical Analysis</div>
          </div>
          <div className="compact-date">{emiten.toUpperCase()}</div>
        </div>
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
    <div className="compact-style-card">
      <div className="compact-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Technical Analysis</div>
        </div>
        <div className="compact-date">{emiten.toUpperCase()}</div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div className="compact-section">
          <div className="compact-section-title">RSI (14)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="compact-value" style={{ fontSize: '0.9rem', fontWeight: 700, color: data.rsiSignal === 'oversold' ? 'var(--accent-success)' : data.rsiSignal === 'overbought' ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
              {fmt(data.rsi)}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: data.rsiSignal === 'oversold' ? 'rgba(56, 239, 125, 0.2)' : data.rsiSignal === 'overbought' ? 'rgba(245, 87, 108, 0.2)' : 'rgba(255,255,255,0.08)', textTransform: 'capitalize' }}>
              {data.rsiSignal}
            </span>
          </div>
        </div>

        {data.macd && (
          <div className="compact-section">
            <div className="compact-section-title">MACD</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
              <span>MACD: {fmt(data.macd.macd)}</span>
              <span>Signal: {fmt(data.macd.signal)}</span>
              <span style={{ color: data.macdSignal === 'bullish' ? 'var(--accent-success)' : data.macdSignal === 'bearish' ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                {data.macdSignal}
              </span>
            </div>
          </div>
        )}

        <div className="compact-section">
          <div className="compact-section-title">Moving Averages</div>
          <div className="compact-grid-3">
            <div className="compact-cell">
              <span className="compact-label">SMA 20</span>
              <span className="compact-value">{fmt(data.sma20)}</span>
            </div>
            <div className="compact-cell">
              <span className="compact-label">SMA 50</span>
              <span className="compact-value">{fmt(data.sma50)}</span>
            </div>
            <div className="compact-cell">
              <span className="compact-label">SMA 200</span>
              <span className="compact-value">{fmt(data.sma200)}</span>
            </div>
          </div>
        </div>

        {data.bollinger && (
          <div className="compact-section">
            <div className="compact-section-title">Bollinger Bands</div>
            <div style={{ fontSize: '0.75rem' }}>
              Upper: {fmt(data.bollinger.upper)} | Mid: {fmt(data.bollinger.middle)} | Lower: {fmt(data.bollinger.lower)}
            </div>
            <span className="compact-label" style={{ marginTop: '0.25rem', display: 'block' }}>Price vs BB: {data.priceVsBB}</span>
          </div>
        )}

        {(data.support != null || data.resistance != null) && (
          <div className="compact-section">
            <div className="compact-section-title">Support / Resistance</div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
              <span>Support: Rp {fmt(data.support)}</span>
              <span>Resistance: Rp {fmt(data.resistance)}</span>
            </div>
          </div>
        )}

        <div className="compact-section" style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: `1px solid ${signalColor}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="compact-label">Trend</div>
              <div className="compact-value" style={{ textTransform: 'capitalize', fontWeight: 600 }}>{data.trend}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="compact-label">Signal</div>
              <div className="compact-value" style={{ fontSize: '0.85rem', fontWeight: 700, color: signalColor, textTransform: 'uppercase' }}>{data.signal}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
