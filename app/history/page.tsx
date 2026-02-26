'use client';

import { useAppUser } from '../components/UserProvider';
import { ADMIN_EMAIL } from '@/lib/config';
import SearchHistoryPage from '../search-history/page';

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
          Halaman History hanya tersedia untuk admin.
        </div>
      </div>
    );
  }

  // For admin, reuse the SearchHistory view, which already shows all users when isAdmin=true
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <SearchHistoryPage />
    </div>
  );
}
