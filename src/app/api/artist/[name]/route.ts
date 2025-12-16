import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { auth } from '@/auth';
import { getMusicFilePath } from '@/lib/serverUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // Find all tracks by this artist (including those in mixed albums? Or just albums BY this artist?)
    // "Delete an entire discography" usually means "Albums by Artist".
    // But what about tracks where they are just featured? 
    // Let's delete "Albums where artist is [Name]".
    
    const albums = await prisma.album.findMany({
        where: { artist: decodedName },
        include: { tracks: true }
    });

    if (albums.length === 0) {
        return NextResponse.json({ message: 'No albums found for this artist' }, { status: 404 });
    }

    let deletedCount = 0;

    for (const album of albums) {
        // Delete track files
        for (const track of album.tracks) {
            if (track.fileUrl) {
                const filePath = getMusicFilePath(track.fileUrl);
                try {
                    await unlink(filePath);
                } catch (e) {
                    console.warn(`Failed to delete file: ${filePath}`);
                }
            }
        }
        
        // Delete album DB entry
        await prisma.album.delete({ where: { id: album.id } });
        deletedCount++;
    }

    return NextResponse.json({ message: `Deleted ${deletedCount} albums for ${decodedName}` });
  } catch (error) {
    console.error('Delete artist error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
