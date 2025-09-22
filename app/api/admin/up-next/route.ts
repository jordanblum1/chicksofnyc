import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import logger from '../../../utils/logger';

const UP_NEXT_KEY = 'up_next_spot';

// Helper function to check if KV is available
function isKvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Helper function to read the up next data
async function readUpNext() {
  try {
    if (!isKvAvailable()) {
      logger.warn('UP_NEXT', 'KV not available, returning null');
      return { spot: null };
    }
    
    const data = await kv.get(UP_NEXT_KEY);
    return data || { spot: null };
  } catch (error) {
    logger.error('UP_NEXT', 'Error reading up next data:', error);
    return { spot: null };
  }
}

// Helper function to write the up next data
async function writeUpNext(data: any) {
  try {
    if (!isKvAvailable()) {
      logger.warn('UP_NEXT', 'KV not available, cannot save data');
      return false;
    }
    
    await kv.set(UP_NEXT_KEY, data);
    return true;
  } catch (error) {
    logger.error('UP_NEXT', 'Error writing up next data:', error);
    return false;
  }
}

// GET: Fetch the current "up next" spot
export async function GET() {
  try {
    const data = await readUpNext();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('API', 'Error fetching up next spot:', error);
    return NextResponse.json({ error: 'Failed to fetch up next spot' }, { status: 500 });
  }
}

// POST: Set a new "up next" spot
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCookie = request.cookies.get('adminAuth');
    const authHeader = request.headers.get('x-admin-auth');
    
    if (authCookie?.value !== 'true' && authHeader !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { spot } = body;

    if (!spot || !spot.name || !spot.address) {
      return NextResponse.json({ error: 'Invalid spot data' }, { status: 400 });
    }

    const success = await writeUpNext({ spot });
    
    if (success) {
      return NextResponse.json({ success: true, spot });
    } else {
      return NextResponse.json({ error: 'Failed to save up next spot' }, { status: 500 });
    }
  } catch (error) {
    logger.error('API', 'Error setting up next spot:', error);
    return NextResponse.json({ error: 'Failed to set up next spot' }, { status: 500 });
  }
}

// DELETE: Clear the "up next" spot
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const authCookie = request.cookies.get('adminAuth');
    const authHeader = request.headers.get('x-admin-auth');
    
    if (authCookie?.value !== 'true' && authHeader !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await writeUpNext({ spot: null });
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to clear up next spot' }, { status: 500 });
    }
  } catch (error) {
    logger.error('API', 'Error clearing up next spot:', error);
    return NextResponse.json({ error: 'Failed to clear up next spot' }, { status: 500 });
  }
}
