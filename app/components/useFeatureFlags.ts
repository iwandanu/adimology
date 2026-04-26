'use client';

import { useEffect, useState } from 'react';
import type { FeatureFlagsMap } from '@/lib/featureFlags';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlagsMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/feature-flags', { cache: 'no-store' });
        const json = await res.json();
        if (mounted && json?.success) {
          setFlags(json.data as FeatureFlagsMap);
        }
      } catch {
        // ignore (fallback handled by null)
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { flags, loading, setFlags };
}

