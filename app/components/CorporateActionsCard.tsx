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
      <div className="keystats-card" style={{ padding: '1rem', minHeight: '140px' }}>
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate Actions</div>
          </div>
          <div className="compact-date">{emiten.toUpperCase()}</div>
        </div>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
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
      <div className="keystats-card" style={{ padding: '1rem' }}>
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate Actions</div>
          </div>
          <div className="compact-date">{emiten.toUpperCase()}</div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          No corporate actions data available (dividends, splits).
        </p>
        <a href="https://www.idx.co.id/en/listed-companies/corporate-actions/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '0.5rem', display: 'inline-block' }}>
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
    <div className="keystats-card" style={{ padding: '1rem' }}>
      <div className="compact-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate Actions</div>
        </div>
        <div className="compact-date">{emiten.toUpperCase()}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
        {(data.exDividendDate || data.dividendDate || data.dividendYield != null || data.lastDividendValue != null) && (
          <div className="keystats-section">
            <div className="keystats-section-title">Summary</div>
            <table className="keystats-table">
              <tbody>
                {data.exDividendDate && (
                  <tr>
                    <td className="keystats-label">Ex-Dividend</td>
                    <td className="keystats-value">{data.exDividendDate}</td>
                  </tr>
                )}
                {data.dividendDate && (
                  <tr>
                    <td className="keystats-label">Dividend Date</td>
                    <td className="keystats-value">{data.dividendDate}</td>
                  </tr>
                )}
                {data.dividendYield != null && !Number.isNaN(data.dividendYield) && (
                  <tr>
                    <td className="keystats-label">Dividend Yield</td>
                    <td className="keystats-value">{(data.dividendYield * 100).toFixed(2)}%</td>
                  </tr>
                )}
                {data.lastDividendValue != null && !Number.isNaN(data.lastDividendValue) && (
                  <tr>
                    <td className="keystats-label">Last Dividend</td>
                    <td className="keystats-value">{formatRp(data.lastDividendValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data.dividends && data.dividends.length > 0 && (
          <div className="keystats-section">
            <div className="keystats-section-title">Recent Dividends</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {data.dividends.slice(0, 6).map((d, i) => (
                <span key={`${d.date}-${i}`} style={{ padding: '0.2rem 0.45rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '6px', fontSize: '0.7rem' }}>
                  {d.date}: {formatRp(d.amount)}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.splits && data.splits.length > 0 && (
          <div className="keystats-section">
            <div className="keystats-section-title">Stock Splits</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {data.splits.map((s, i) => (
                <span key={`${s.date}-${i}`} style={{ padding: '0.2rem 0.45rem', background: 'rgba(124, 58, 237, 0.15)', borderRadius: '6px', fontSize: '0.7rem' }}>
                  {s.date}: {s.ratio}
                </span>
              ))}
            </div>
          </div>
        )}

        <a href="https://www.idx.co.id/en/listed-companies/corporate-actions/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'inline-block' }}>
          Full list: IDX Corporate Actions →
        </a>
      </div>
    </div>
  );
}
