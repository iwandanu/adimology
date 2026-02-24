'use client';

import Link from 'next/link';

export default function AdvancedAnalyticsPage() {
  const sections = [
    {
      id: 'correlation',
      title: 'Correlation Analysis',
      description:
        'Hitung korelasi harga antar saham untuk diversifikasi portofolio dan hedging, berbasis Datasaham Correlation Matrix.',
      href: '/advanced-analytics/correlation',
      status: 'Available',
    },
    {
      id: 'multi-market-screener',
      title: 'Multi Market Screener',
      description:
        'Screen saham IDX berdasarkan faktor global (komoditas & forex) untuk mencari peluang yang diuntungkan pergerakan global.',
      href: '/advanced-analytics/multi-market-screener',
      status: 'Available',
    },
    {
      id: 'factor-scoring',
      title: 'Factor Scoring',
      description:
        'Skor gabungan berdasarkan faktor teknikal dan bandarmology untuk mempermudah pemilihan saham.',
      href: undefined,
      status: 'Coming soon',
    },
  ];

  return (
    <div className="app-container">
      <main className="container" style={{ paddingTop: '2rem' }}>
        <h1 className="page-title">Advanced Analytics</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Kumpulan analitik lanjutan yang dirancang untuk membantu screening dan prioritisasi saham
          dengan lebih cepat, mengacu pada fitur &quot;Advanced Analytics&quot; di Datasaham.io.
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
            {sections.map((s) =>
              s.href ? (
                <Link
                  key={s.id}
                  href={s.href}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {s.description}
                  </div>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {s.status}
                  </div>
                </Link>
              ) : (
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
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {s.status}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


