'use client';

import { supabase } from '@/lib/supabase';

interface ConnectRequiredCardProps {
  message: string;
}

export default function ConnectRequiredCard({ message }: ConnectRequiredCardProps) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        borderColor: 'rgba(124, 58, 237, 0.5)',
        background: 'rgba(124, 58, 237, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
      <button
        type="button"
        onClick={() =>
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
          })
        }
        style={{
          fontSize: '0.85rem',
          padding: '8px 16px',
          borderRadius: '999px',
          border: '1px solid var(--accent-primary)',
          background: 'rgba(124, 58, 237, 0.15)',
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Connect Google
      </button>
    </div>
  );
}
