import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import logger from '../../utils/logger';

Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

export async function POST(request: NextRequest) {
  try {
    const { spotId } = await request.json();

    if (!spotId) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      );
    }

    // Get current record
    const record = await base('all-spots').find(spotId);
    const currentVotes = record.fields['Votes'] ? Number(record.fields['Votes']) : 0;

    // Update votes
    const updatedRecord = await base('all-spots').update(spotId, {
      'Votes': currentVotes + 1
    });

    return NextResponse.json({
      success: true,
      votes: updatedRecord.fields['Votes']
    });
  } catch (error) {
    logger.error('APP', 'Error updating votes:', error);
    return NextResponse.json(
      { error: 'Failed to update votes' },
      { status: 500 }
    );
  }
} 