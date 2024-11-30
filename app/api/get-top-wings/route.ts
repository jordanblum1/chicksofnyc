import { NextResponse } from 'next/server';
import Airtable from 'airtable';

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

// 12 hours in seconds
const CACHE_MAX_AGE = 60 * 60 * 12;

// Configure route segment config for server-side caching
export const runtime = 'edge';
export const preferredRegion = 'auto';
export const revalidate = CACHE_MAX_AGE;

export async function GET() {
  try {
    const records = await base('wing-spots').select({
      maxRecords: 5,
      sort: [{field: 'Overall Ranking', direction: 'desc'}],
      filterByFormula: 'NOT({Overall Ranking} = "")'  // Only get spots that have been ranked
    }).firstPage();

    const topSpots = records.map(record => ({
      id: record.id,
      name: record.fields['Spot Name'],
      address: record.fields['Address'],
      overallRanking: record.fields['Overall Ranking'],
      sauce: record.fields['Sauce (0-10)'],
      crispyness: record.fields['Crispy-ness (0-10)'],
      meat: record.fields['Meat (0-10)']
    }));

    return new NextResponse(
      JSON.stringify({ success: true, data: topSpots }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
        }
      }
    );
  } catch (error) {
    console.error('Airtable fetch error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch rankings' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 
