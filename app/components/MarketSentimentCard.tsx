'use client';

interface MarketSentimentCardProps {
  emiten: string;
  data: MarketSentimentData | null;
  loading?: boolean;
}

interface RetailSentiment {
  volume_participation: number;
  fomo_score: number;
  small_lot_percentage: number;
  frequency_score: number;
  status: 'PANIC' | 'FEARFUL' | 'NEUTRAL' | 'BULLISH' | 'EUPHORIC';
  description: string;
}

interface BandarSentiment {
  institutional_flow: number;
  foreign_flow: number;
  accumulation_score: number;
  large_lot_percentage: number;
  top_broker_net_flow: number;
  status: 'EXITING' | 'DISTRIBUTING' | 'NEUTRAL' | 'HOLDING' | 'ACCUMULATING';
  description: string;
}

interface MarketSentimentData {
  symbol: string;
  retail_sentiment: RetailSentiment;
  bandar_sentiment: BandarSentiment;
  divergence: {
    type: string;
    interpretation: string;
    signal: 'OPPORTUNITY' | 'DANGER' | 'ALIGNED_BULLISH' | 'ALIGNED_BEARISH' | 'NEUTRAL';
  };
  recommendation: string;
  analysis_period_days: number;
}

export default function MarketSentimentCard({ emiten, data, loading }: MarketSentimentCardProps) {
  if (loading) {
    return (
      <div className="compact-style-card">
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Sentiment</div>
          </div>
          <div className="compact-date">{emiten.toUpperCase()}</div>
        </div>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="compact-style-card">
        <div className="compact-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Sentiment</div>
          </div>
          <div className="compact-date">{emiten.toUpperCase()}</div>
        </div>
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          No sentiment data available
        </div>
      </div>
    );
  }

  const getRetailStatusColor = (status: string) => {
    switch (status) {
      case 'PANIC': return '#f5576c'; // Red - potential bottom
      case 'FEARFUL': return '#ff9800'; // Orange
      case 'BULLISH': return '#38ef7d'; // Green
      case 'EUPHORIC': return '#ffc107'; // Yellow/Amber - warning (potential top)
      default: return 'var(--text-muted)';
    }
  };

  const getBandarStatusColor = (status: string) => {
    switch (status) {
      case 'EXITING': return '#f5576c'; // Red
      case 'DISTRIBUTING': return '#ff9800'; // Orange
      case 'ACCUMULATING': return '#38ef7d'; // Green
      case 'HOLDING': return '#667eea'; // Blue
      default: return 'var(--text-muted)';
    }
  };

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case 'OPPORTUNITY':
        return { icon: '🎯', color: '#38ef7d', bg: 'rgba(56, 239, 125, 0.15)' };
      case 'DANGER':
        return { icon: '⚠️', color: '#f5576c', bg: 'rgba(245, 87, 108, 0.15)' };
      case 'ALIGNED_BULLISH':
        return { icon: '📈', color: '#38ef7d', bg: 'rgba(56, 239, 125, 0.15)' };
      case 'ALIGNED_BEARISH':
        return { icon: '📉', color: '#f5576c', bg: 'rgba(245, 87, 108, 0.15)' };
      default:
        return { icon: '➖', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const signalBadge = getSignalBadge(data.divergence.signal);

  return (
    <div className="compact-style-card">
      <div className="compact-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <div className="compact-ticker" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Sentiment</div>
        </div>
        <div className="compact-date">{emiten.toUpperCase()}</div>
      </div>

      {/* Analysis Period */}
      <div style={{ 
        fontSize: '0.65rem', 
        color: 'var(--text-muted)', 
        textAlign: 'right', 
        marginBottom: '0.75rem',
        paddingTop: '0.25rem'
      }}>
        {data.analysis_period_days} days analysis
      </div>

      {/* Divergence Signal Badge - Prominent Display */}
      <div style={{
        background: signalBadge.bg,
        border: `1px solid ${signalBadge.color}40`,
        borderRadius: '12px',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ fontSize: '1.5rem' }}>{signalBadge.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            color: signalBadge.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.25rem'
          }}>
            {data.divergence.type.replace(/_/g, ' ')}
          </div>
          <div style={{ 
            fontSize: '0.65rem', 
            color: 'var(--text-secondary)',
            lineHeight: 1.4
          }}>
            {data.divergence.interpretation}
          </div>
        </div>
      </div>

      {/* Retail Sentiment */}
      <div className="compact-section">
        <div className="compact-section-title" style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>👥 Retail Sentiment</span>
          <span style={{ 
            background: `${getRetailStatusColor(data.retail_sentiment.status)}20`,
            color: getRetailStatusColor(data.retail_sentiment.status),
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700
          }}>
            {data.retail_sentiment.status}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {/* Retail Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div className="compact-label">FOMO Score</div>
              <div className="compact-value">{data.retail_sentiment.fomo_score.toFixed(1)}</div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div className="compact-label">Frequency</div>
              <div className="compact-value">{data.retail_sentiment.frequency_score.toFixed(1)}</div>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '0.65rem', 
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '6px',
            borderLeft: `3px solid ${getRetailStatusColor(data.retail_sentiment.status)}`
          }}>
            {data.retail_sentiment.description}
          </div>
        </div>
      </div>

      {/* Bandar/Smart Money Sentiment */}
      <div className="compact-section">
        <div className="compact-section-title" style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>💼 Smart Money</span>
          <span style={{ 
            background: `${getBandarStatusColor(data.bandar_sentiment.status)}20`,
            color: getBandarStatusColor(data.bandar_sentiment.status),
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700
          }}>
            {data.bandar_sentiment.status}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {/* Bandar Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div className="compact-label">Accumulation</div>
              <div className="compact-value" style={{ 
                color: data.bandar_sentiment.accumulation_score > 0 ? '#38ef7d' : '#f5576c' 
              }}>
                {data.bandar_sentiment.accumulation_score > 0 ? '+' : ''}{data.bandar_sentiment.accumulation_score.toFixed(1)}
              </div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <div className="compact-label">Foreign Flow</div>
              <div className="compact-value" style={{ 
                color: data.bandar_sentiment.foreign_flow > 0 ? '#38ef7d' : '#f5576c' 
              }}>
                {data.bandar_sentiment.foreign_flow > 0 ? '+' : ''}{(data.bandar_sentiment.foreign_flow / 1_000_000_000).toFixed(2)}B
              </div>
            </div>
          </div>
          
          <div style={{ 
            fontSize: '0.65rem', 
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            padding: '0.4rem 0.6rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '6px',
            borderLeft: `3px solid ${getBandarStatusColor(data.bandar_sentiment.status)}`
          }}>
            {data.bandar_sentiment.description}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="compact-section">
        <div className="compact-section-title">💡 Recommendation</div>
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          padding: '0.6rem',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          {data.recommendation}
        </div>
      </div>

      {/* Data Source Footer */}
      <div style={{ 
        marginTop: '0.75rem', 
        paddingTop: '0.5rem', 
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        Data: <a 
          href="https://api.datasaham.io/swagger#tag/market-sentiment" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
        >
          DataSaham.io
        </a>
      </div>
    </div>
  );
}
