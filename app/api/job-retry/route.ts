import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { jobName } = await request.json();

    if (jobName !== 'analyze-watchlist') {
      return NextResponse.json({ success: false, error: 'Unsupported job type' }, { status: 400 });
    }

    // Trigger manual Netlify function instead of scheduled one
    // Scheduled functions return 500 when called via HTTP
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const functionUrl = `${baseUrl}/.netlify/functions/analyze-watchlist-manual`;

    console.log(`[Job Retry] Triggering background job at: ${functionUrl}`);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { message: responseText };
    }

    return NextResponse.json({ success: true, data: result });

    } catch (error) {
    console.error('[Job Retry] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
