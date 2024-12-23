import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Revalidate both the homepage and rankings page
    revalidatePath('/', 'layout');
    revalidatePath('/rankings', 'layout');
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 });
  }
} 
