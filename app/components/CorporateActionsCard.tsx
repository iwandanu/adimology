'use client';

import type { CorporateActions } from '@/lib/corporateActions';

interface CorporateActionsCardProps {
  emiten: string;
  data: CorporateActions | null;
  loading?: boolean;
}

export default function CorporateActionsCard({
  emiten,
  data,
  loading = false,
}: CorporateActionsCardProps) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem', minHeight: '140px' }}>
        <div className="compact-header" style={{ marginBottom: '1rem' }}>
          <span className="compact-ticker" style={{ textTransform: 'uppercase' }}>
            Corporate Actions
          </span>
          <span className="compact-date">{emiten.toUpperCase()}</span>
        </div>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          Loading dividends &amp; splits...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const hasAny =
    (data.dividends?.length ?? 0) > 0 ||
    (data.splits?.length ?? 0) > 0 ||
    data.exDividendDate ||
    data.dividendDate ||
    data.dividendYield != null ||
    data.lastDividendValue != null;

  if (!hasAny) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="compact-header" style={{ marginBottom: '1rem' }}>
          <span className="compact-ticker" style={{ textTransform: 'uppercase' }}>
            Corporate Actions
          </span>
          <span className="compact-date">{emiten.toUpperCase()}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No corporate actions data available (dividends, splits).
        </p>
        <a
          href="https://www.idx.co.id/en/listed-companies/corporate-actions/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '0.5rem', display: 'inline-block' }}
        >
          View IDX corporate actions →
        </a>
      </div>
    );
  }

  const formatRp = (n: number) =>
    n != null && !Number.isNaN(n)
      ? `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`
      : '-';

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div className="compact-header" style={{ marginBottom: '1rem' }}>
        <span className="compact-ticker" style={{ textTransform: 'uppercase' }}>
          Corporate Actions
        </span>
        <span className="compact-date">{emiten.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
        {/* Upcoming / Summary */}
        {(data.exDividendDate || data.dividendDate || data.dividendYield != null || data.lastDividendValue != null) && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Summary
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {data.exDividendDate && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Ex-Dividend</td>
                    <td style={{ textAlign: 'right' }}>{data.exDividendDate}</td>
                  </tr>
                )}
                {data.dividendDate && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Dividend Date</td>
                    <td style={{ textAlign: 'right' }}>{data.dividendDate}</td>
                  </tr>
                )}
                {data.dividendYield != null && !Number.isNaN(data.dividendYield) && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Dividend Yield</td>
                    <td style={{ textAlign: 'right' }}>{(data.dividendYield * 100).toFixed(2)}%</td>
                  </tr>
                )}
                {data.lastDividendValue != null && !Number.isNaN(data.lastDividendValue) && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '0.25rem 0' }}>Last Dividend</td>
                    <td style={{ textAlign: 'right' }}>{formatRp(data.lastDividendValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Dividends */}
        {data.dividends && data.dividends.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Recent Dividends (last 2 years)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.dividends.slice(0, 6).map((d, i) => (
                <span
                  key={`${d.date}-${i}`}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  {d.date}: {formatRp(d.amount)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Splits */}
        {data.splits && data.splits.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Stock Splits
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.splits.map((s, i) => (
                <span
                  key={`${s.date}-${i}`}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(124, 58, 237, 0.15)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                >
                  {s.date}: {s.ratio}
                </span>
              ))}
            </div>
          </div>
        )}

        <a
          href="https://www.idx.co.id/en/listed-companies/corporate-actions/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'inline-block' }}
        >
          Full list: IDX Corporate Actions →
        </a>
      </div>
    </div>
  );
}
