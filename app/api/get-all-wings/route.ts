import { NextResponse } from 'next/server';
import Airtable from 'airtable';

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

export async function GET() {
  try {
    const records = await base('wing-spots').select({
      sort: [{field: 'Overall Ranking', direction: 'desc'}],
      filterByFormula: 'NOT({Overall Ranking} = "")'
    }).firstPage();

    const spots = records.map(record => ({
      id: record.id,
      name: record.fields['Spot Name'],
      address: record.fields['Address'],
      overallRanking: record.fields['Overall Ranking'],
      sauce: record.fields['Sauce (0-10)'],
      crispyness: record.fields['Crispy-ness (0-10)'],
      meat: record.fields['Meat (0-10)']
    }));

    return Response.json(
      { success: true, data: spots },
      {
        headers: {
          'Cache-Control': 'no-store',
          'x-next-cache-tags': 'wings'
        }
      }
    );
  } catch (error) {
    console.error('Airtable fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
} 
