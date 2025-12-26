import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cache for 1 day

type FundDetails = {
  nav: number;
  name: string;
  date: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schemes = searchParams.get('schemes');

  if (!schemes) {
    return new NextResponse(
      JSON.stringify({ message: 'Scheme codes are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const schemeCodes = schemes.split(',');
  const navData: Record<string, FundDetails> = {};

  try {
    const fetchPromises = schemeCodes.map(async (code) => {
      try {
        const response = await fetch(`https://api.mfapi.in/mf/${code}`);
        if (!response.ok) {
          console.error(`Failed to fetch NAV for scheme ${code}: ${response.statusText}`);
          return;
        }
        const data = await response.json();
        const latestData = data?.data?.[0];
        const nav = parseFloat(latestData?.nav);
        const date = latestData?.date;
        const name = data?.meta?.scheme_name;

        if (code && !isNaN(nav) && name && date) {
          navData[code] = { nav, name, date };
        }
      } catch (error) {
        console.error(`Error fetching or parsing data for scheme ${code}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    
    if (Object.keys(navData).length === 0) {
        throw new Error('Could not fetch NAV data for any of the provided schemes.');
    }

    return NextResponse.json(navData);

  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
