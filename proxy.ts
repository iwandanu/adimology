import { NextRequest, NextResponse } from 'next/server';

// Legacy password/session proxy from upstream is disabled.
// Google Auth (Supabase) is now the primary access control,
// and API routes are allowed to rely on that client-side gating.

export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
