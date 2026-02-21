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
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="card-title">📋 Trading Plan</h3>
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
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 className="card-title">📋 Trading Plan — {data.emiten}</h3>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {/* Entry */}
        <div className="compact-section">
          <div className="compact-section-title">Entry</div>
          <div>
            Price: Rp {fmt(data.entry.price)} | {data.entry.type} | {data.entry.signal}
          </div>
        </div>

        {/* Take Profit */}
        <div className="compact-section">
          <div className="compact-section-title">Take Profit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.takeProfit.map((tp, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                }}
              >
                <span>{tp.label}</span>
                <span>
                  Rp {fmt(tp.price)} ({tp.percentGain >= 0 ? '+' : ''}
                  {tp.percentGain.toFixed(2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="compact-section">
          <div className="compact-section-title">Stop Loss</div>
          <div>
            Rp {fmt(data.stopLoss.price)} (-{data.stopLoss.percentLoss.toFixed(2)}%) —{' '}
            {data.stopLoss.method}
          </div>
        </div>

        {/* Risk/Reward */}
        <div className="compact-section">
          <div className="compact-section-title">Risk / Reward</div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>R:R TP1: 1:{data.riskReward.rrToTP1.toFixed(1)}</span>
            <span>R:R TP2: 1:{data.riskReward.rrToTP2.toFixed(1)}</span>
            <span style={{ color: rrQualityColor, fontWeight: 600 }}>
              Quality: {data.riskReward.quality.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Position Sizing */}
        {data.positionSizing && (
          <div className="compact-section">
            <div className="compact-section-title">Position Sizing (2% Risk)</div>
            <div style={{ fontSize: '0.9rem' }}>
              Account: Rp {fmt(data.positionSizing.accountSize)} | Max Risk: Rp{' '}
              {fmt(data.positionSizing.maxRiskAmount)}
              <br />
              Suggested: {data.positionSizing.suggestedLots} lot (
              {fmt(data.positionSizing.suggestedShares)} shares) | Value: Rp{' '}
              {fmt(data.positionSizing.positionValue)} (
              {data.positionSizing.percentOfAccount.toFixed(1)}%)
            </div>
          </div>
        )}

        {/* Execution Strategy */}
        <div className="compact-section">
          <div className="compact-section-title">Execution</div>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem' }}>
            {data.executionStrategy.map((s, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                {s.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
