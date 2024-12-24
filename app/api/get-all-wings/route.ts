import { NextResponse } from 'next/server';
import Airtable from 'airtable';

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

// 12 hours in seconds
const CACHE_MAX_AGE = 60 * 60 * 12;

export const revalidate = CACHE_MAX_AGE;

export async function GET() {
  try {
    const records = await base('wing-spots').select({
      view: 'Grid view',
      sort: [{ field: 'Overall Ranking', direction: 'desc' }]
    }).firstPage();

    const spots = records.map(record => ({
      id: record.id,
      name: record.fields['Spot Name'],
      address: record.fields['Address'],
      overallRanking: record.fields['Overall Ranking'],
      sauce: record.fields['Sauce (0-10)'],
      crispyness: record.fields['Crispy-ness (0-10)'],
      meat: record.fields['Meat (0-10)'],
      instagram: record.fields['Instagram']
    }));

    return NextResponse.json(
      { success: true, data: spots },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`
        }
      }
    );
  } catch (error) {
    console.error('Airtable fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
} 
