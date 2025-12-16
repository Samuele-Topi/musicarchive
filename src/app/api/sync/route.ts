import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncLibrary } from '@/lib/sync';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncLibrary();
    return NextResponse.json({ 
        message: 'Sync complete', 
        ...result
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
