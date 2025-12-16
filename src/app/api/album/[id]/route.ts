import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { getMusicFilePath } from '@/lib/serverUtils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: { tracks: true }
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Delete all track files
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

    // Delete cover image if it's local
    if (album.coverUrl && !album.coverUrl.startsWith('http')) {
        // coverUrl might be /api/cover/... or a real path?
        // Actually the current app serves covers dynamically from ID3 or uses /api/cover/album/[id].
        // If it's dynamic, there's no file to delete (other than the MP3s themselves).
        // But if we saved a custom image? 
        // The implementation says: data: { coverUrl: `/api/cover/album/${album.id}` }
        // So no separate cover file to delete usually.
    }

    // Delete album from DB (Cascade should delete tracks, but let's be safe)
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Album deleted' });
  } catch (error) {
    console.error('Delete album error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
