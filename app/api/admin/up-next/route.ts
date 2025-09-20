import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../../utils/logger';

const UP_NEXT_FILE = path.join(process.cwd(), 'up-next.json');

// Helper function to read the up next data
async function readUpNext() {
  try {
    const data = await fs.readFile(UP_NEXT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return null
    return { spot: null };
  }
}

// Helper function to write the up next data
async function writeUpNext(data: any) {
  try {
    await fs.writeFile(UP_NEXT_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error('API', 'Error writing up next file:', error);
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
