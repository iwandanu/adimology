import { NextResponse } from 'next/server';
import { fetchFeatureFlags } from '@/lib/featureFlags';

export async function GET() {
  try {
    const flags = await fetchFeatureFlags();
    return NextResponse.json({ success: true, data: flags });
  } catch (e) {
    console.error('feature-flags GET error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load feature flags' },
      { status: 500 }
    );
  }
}

