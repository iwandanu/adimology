import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body as { userId?: string; email?: string | null };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          email: email ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('log-user upsert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to upsert user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('log-user error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error in log-user' },
      { status: 500 }
    );
  }
}

