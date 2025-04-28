import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import logger from '../../utils/logger';

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
    const records = await base('all-spots').select({
      view: 'Grid view'
    }).firstPage();

    return NextResponse.json(
      { success: true, data: records.map(record => ({
        id: record.id,
        name: record.fields['Spot Name'],
        address: record.fields['Address'],
        votes: record.fields['Votes'] || 0,
        checkedOut: record.fields['Checked out?'] || false
      })) },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`
        }
      }
    );
  } catch (error) {
    logger.error('APP', 'Airtable fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spots' },
      { status: 500 }
    );
  }
} 