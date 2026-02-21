'use client';

import type { BandarmologyResult } from '@/lib/bandarmology';

interface BandarmologyCardProps {
  data: BandarmologyResult;
  loading?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  early_accumulation: 'Early Accumulation',
  mid_accumulation: 'Mid Accumulation',
  late_accumulation: 'Late Accumulation',
  markup_ready: 'Markup Ready',
  distribution: 'Distribution',
  neutral: 'Neutral',
};

export default function BandarmologyCard({ data, loading }: BandarmologyCardProps) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 className="card-title">🔮 Bandarmology</h3>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
    );
  }

  const flowColor =
    data.flowMomentumSignal === 'buy'
      ? 'var(--accent-success)'
      : data.flowMomentumSignal === 'sell'
        ? 'var(--accent-warning)'
        : 'var(--text-muted)';

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 className="card-title">🔮 Bandarmology — {data.emiten}</h3>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
        Period: {data.period.from} s/d {data.period.to} ({data.period.days} days)
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {/* Flow Momentum */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: `linear-gradient(90deg, ${flowColor}22, transparent)`,
            borderRadius: '12px',
            border: `1px solid ${flowColor}40`,
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flow Momentum</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: flowColor }}>
              {data.flowMomentum}/100
            </div>
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: flowColor,
            }}
          >
            {data.flowMomentumSignal}
          </div>
        </div>

        {/* Phase */}
        <div className="compact-section">
          <div className="compact-section-title">Phase</div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {PHASE_LABELS[data.phase] || data.phase}
          </div>
        </div>

        {/* Broker Composition */}
        <div className="compact-section">
          <div className="compact-section-title">Broker Composition</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(['Smartmoney', 'Whale', 'Retail', 'Mix'] as const).map((t) => {
              const pct = data.brokerComposition?.[t] ?? 0;
              const colorVar = t === 'Smartmoney' ? '--broker-smartmoney' : t === 'Whale' ? '--broker-whale' : t === 'Retail' ? '--broker-retail' : '--broker-mix';
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '90px', fontSize: '0.85rem' }}>{t}</span>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: `var(${colorVar}, var(--text-muted))`,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', minWidth: '40px' }}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern Alerts */}
        {data.patternAlerts.length > 0 && (
          <div className="compact-section">
            <div className="compact-section-title">Pattern Alerts</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
              {data.patternAlerts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(56, 239, 125, 0.1)',
            border: '1px solid rgba(56, 239, 125, 0.3)',
            borderRadius: '12px',
            fontWeight: 600,
          }}
        >
          {data.recommendation}
        </div>
      </div>
    </div>
  );
}
