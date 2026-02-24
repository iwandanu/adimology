export default function AdvancedAnalyticsPage() {
  const sections = [
    {
      id: 'multi-timeframe-trend',
      title: 'Multi-Timeframe Trend',
      description:
        'Ringkasan trend saham berbasis kombinasi indikator (RSI, MACD, SMA) di beberapa timeframe.',
      status: 'Coming soon',
    },
    {
      id: 'volatility-zones',
      title: 'Volatility Zones',
      description:
        'Peta volatilitas untuk menemukan saham dengan pergerakan harga yang menarik namun masih terukur.',
      status: 'Coming soon',
    },
    {
      id: 'factor-scoring',
      title: 'Factor Scoring',
      description:
        'Skor gabungan berdasarkan faktor teknikal dan bandarmology untuk mempermudah pemilihan saham.',
      status: 'Coming soon',
    },
  ];

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Advanced Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Kumpulan analitik lanjutan yang dirancang untuk membantu screening dan prioritisasi saham
          dengan lebih cepat, mengacu pada ide fitur &quot;Advanced Analytics&quot; di DataSaham.io.
        </p>

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Menu Advanced Analytics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {sections.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {s.description}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

