import { NextRequest, NextResponse } from 'next/server';
import { createBrakotBrekotAnalysis, getBrakotBrekotAnalysesByEmiten } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emiten = searchParams.get('emiten')?.toUpperCase();

  if (!emiten) {
    return NextResponse.json({ error: 'Missing emiten parameter' }, { status: 400 });
  }

  try {
    const analyses = await getBrakotBrekotAnalysesByEmiten(emiten);

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No BrakotBrekot analysis found',
      });
    }

    return NextResponse.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('Error fetching BrakotBrekot analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emiten = body.emiten?.toUpperCase();
    const brokerSummary = body.brokerSummary;
    const technicalData = body.technicalData;
    const bandarmology = body.bandarmology;

    if (!emiten) {
      return NextResponse.json({ error: 'Missing emiten parameter' }, { status: 400 });
    }

    const analysis = await createBrakotBrekotAnalysis(emiten);

    const host = request.headers.get('host');
    const baseUrl = host?.includes('localhost')
      ? 'http://localhost:8888'
      : `https://${host}`;

    const functionUrl = baseUrl.includes('/.netlify/functions')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/.netlify/functions`;

    console.log(`[BrakotBrekot] Triggering background at: ${functionUrl}/analyze-brakotbrekot-background`);

    fetch(`${functionUrl}/analyze-brakotbrekot-background?emiten=${emiten}&id=${analysis.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brokerSummary,
        technicalData,
        bandarmology,
      }),
    }).catch((err) => console.error('Failed to trigger BrakotBrekot background:', err));

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'BrakotBrekot analysis started',
    });
  } catch (error) {
    console.error('Error starting BrakotBrekot analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}
