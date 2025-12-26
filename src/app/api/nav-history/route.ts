import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cache for 1 day

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schemeCode = searchParams.get('schemeCode');

  if (!schemeCode) {
    return new NextResponse(
      JSON.stringify({ message: 'Scheme code is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${schemeCode}: ${response.status} ${errorText}`);
        return new NextResponse(
            JSON.stringify({ message: `Failed to fetch data for scheme ${schemeCode}.` }),
            { status: response.status, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.data)) {
        return new NextResponse(
            JSON.stringify({ message: 'Invalid data format received from API.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Get the last 365 entries
    const history = data.data.slice(0, 365);

    return NextResponse.json(history);

  } catch (error: any) {
    console.error(`Internal Server Error for ${schemeCode}:`, error);
    return new NextResponse(
      JSON.stringify({ message: error.message || 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
