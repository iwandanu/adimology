import { NextRequest, NextResponse } from 'next/server';
import { fetchFeatureFlags, upsertFeatureFlag, type FeatureFlagKey } from '@/lib/featureFlags';
import { isAdminRequest } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const ok = await isAdminRequest(request);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const flags = await fetchFeatureFlags();
    return NextResponse.json({ success: true, data: flags });
  } catch (e) {
    console.error('admin feature-flags GET error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ok = await isAdminRequest(request);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as { key?: FeatureFlagKey; enabled?: boolean };
    if (!body?.key || typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, enabled' },
        { status: 400 }
      );
    }

    await upsertFeatureFlag(body.key, body.enabled);
    const flags = await fetchFeatureFlags();
    return NextResponse.json({ success: true, data: flags });
  } catch (e) {
    console.error('admin feature-flags POST error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}

