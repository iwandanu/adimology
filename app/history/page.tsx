'use client';

import WatchlistHistoryTable from '../components/WatchlistHistoryTable';
import { useAppUser } from '../components/UserProvider';
import { ADMIN_EMAIL } from '@/lib/config';

export default function HistoryPage() {
  const { user, loading } = useAppUser();
  const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Memuat sesi pengguna...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            fontSize: '0.9rem',
            maxWidth: '480px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          Halaman Watchlist History hanya tersedia untuk admin.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <WatchlistHistoryTable />
    </div>
  );
}
