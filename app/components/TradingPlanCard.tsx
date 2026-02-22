'use client';

import type { TradingPlanResult } from '@/lib/tradingPlan';

interface TradingPlanCardProps {
  data: TradingPlanResult;
  loading?: boolean;
}

export default function TradingPlanCard({ data, loading }: TradingPlanCardProps) {
  const fmt = (n: number) => n.toLocaleString('id-ID');

  if (loading) {
    return (
      <div className="compact-style-card">
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trading Plan</div>
          </div>
          <div className="compact-date">{data.emiten.toUpperCase()}</div>
        </div>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
    );
  }

  const rrQualityColor =
    data.riskReward.quality === 'good'
      ? 'var(--accent-success)'
      : data.riskReward.quality === 'poor'
        ? 'var(--accent-warning)'
        : 'var(--text-muted)';

  return (
    <div className="compact-style-card">
      <div className="compact-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trading Plan</div>
        </div>
        <div className="compact-date">{data.emiten.toUpperCase()}</div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div className="compact-section">
          <div className="compact-section-title">Entry</div>
          <div className="compact-value" style={{ fontSize: '0.75rem' }}>
            Price: Rp {fmt(data.entry.price)} | {data.entry.type} | {data.entry.signal}
          </div>
        </div>

        <div className="compact-section">
          <div className="compact-section-title">Take Profit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {data.takeProfit.map((tp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem' }}>
                <span className="compact-label">{tp.label}</span>
                <span className="compact-value">
                  Rp {fmt(tp.price)} ({tp.percentGain >= 0 ? '+' : ''}{tp.percentGain.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="compact-section">
          <div className="compact-section-title">Stop Loss</div>
          <div className="compact-value" style={{ fontSize: '0.75rem' }}>
            Rp {fmt(data.stopLoss.price)} (-{data.stopLoss.percentLoss.toFixed(2)}%) — {data.stopLoss.method}
          </div>
        </div>

        <div className="compact-section">
          <div className="compact-section-title">Risk / Reward</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span>R:R TP1: 1:{data.riskReward.rrToTP1.toFixed(1)}</span>
            <span>R:R TP2: 1:{data.riskReward.rrToTP2.toFixed(1)}</span>
            <span style={{ color: rrQualityColor, fontWeight: 600 }}>Quality: {data.riskReward.quality.toUpperCase()}</span>
          </div>
        </div>

        {data.positionSizing && (
          <div className="compact-section">
            <div className="compact-section-title">Position Sizing (2% Risk)</div>
            <div style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>
              Account: Rp {fmt(data.positionSizing.accountSize)} | Max Risk: Rp {fmt(data.positionSizing.maxRiskAmount)}
              <br />
              Suggested: {data.positionSizing.suggestedLots} lot ({fmt(data.positionSizing.suggestedShares)} shares) | Value: Rp {fmt(data.positionSizing.positionValue)} ({data.positionSizing.percentOfAccount.toFixed(1)}%)
            </div>
          </div>
        )}

        <div className="compact-section">
          <div className="compact-section-title">Execution</div>
          <ol style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', lineHeight: 1.6 }}>
            {data.executionStrategy.map((s, i) => (
              <li key={i} style={{ marginBottom: '0.2rem' }}>{s.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
