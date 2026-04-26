import { supabase } from '@/lib/supabase';
import { ADMIN_EMAIL } from '@/lib/config';
import type { NextRequest } from 'next/server';

export async function getRequestUserEmail(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const tokenMatch = auth.match(/^Bearer\s+(.+)$/i);
  const token = tokenMatch?.[1]?.trim();
  if (!token) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.email) return null;
    return data.user.email.toLowerCase();
  } catch {
    return null;
  }
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const email = await getRequestUserEmail(request);
  return !!email && !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}

