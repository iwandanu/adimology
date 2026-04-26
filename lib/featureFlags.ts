import { supabase } from '@/lib/supabase';

export type FeatureFlagKey =
  | 'menu_search_history'
  | 'menu_performance'
  | 'menu_screener'
  | 'menu_minervini_screener'
  | 'menu_retail_opportunity'
  | 'menu_advanced_analytics'
  | 'api_screen'
  | 'api_advanced_analytics'
  | 'api_retail_opportunity';

export type FeatureFlagsMap = Record<FeatureFlagKey, boolean>;

const DEFAULT_FLAGS: FeatureFlagsMap = {
  menu_search_history: true,
  menu_performance: true,
  menu_screener: true,
  menu_minervini_screener: true,
  menu_retail_opportunity: true,
  menu_advanced_analytics: true,
  api_screen: true,
  api_advanced_analytics: true,
  api_retail_opportunity: true,
};

function isFeatureFlagKey(k: string): k is FeatureFlagKey {
  return Object.prototype.hasOwnProperty.call(DEFAULT_FLAGS, k);
}

export async function fetchFeatureFlags(): Promise<FeatureFlagsMap> {
  const { data, error } = await supabase.from('feature_flags').select('key, enabled');
  if (error || !data) return { ...DEFAULT_FLAGS };

  const merged: FeatureFlagsMap = { ...DEFAULT_FLAGS };
  for (const row of data as Array<{ key: string; enabled: boolean }>) {
    if (row?.key && isFeatureFlagKey(row.key)) {
      merged[row.key] = !!row.enabled;
    }
  }
  return merged;
}

export async function upsertFeatureFlag(key: FeatureFlagKey, enabled: boolean) {
  const { data, error } = await supabase
    .from('feature_flags')
    .upsert({ key, enabled, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

