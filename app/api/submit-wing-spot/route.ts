import { NextResponse } from 'next/server';
import Airtable from 'airtable';
import logger from '../../utils/logger';

// Configure Airtable with bearer token
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT,
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

export async function POST(request: Request) {
  try {
    const { placeName, address, additionalComments, email } = await request.json();

    // Log the field names we're trying to use
    logger.info('APP', 'Attempting to create record with fields:', {
      'Name': placeName,
      'Address': address,
      'Comments': additionalComments,
      'Email': email,
      'Status': 'Haven\'t Checked Out'
    });

    await base('wing-suggestions').create([
      {
        fields: {
          'Name': placeName,
          'Address': address,
          'Comments': additionalComments,
          'Email': email,
          'Status': 'Haven\'t Checked Out'
        }
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('APP', 'Airtable submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit to Airtable' },
      { status: 500 }
    );
  }
} 
