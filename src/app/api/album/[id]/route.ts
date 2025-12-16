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

  const deleteFiles = request.nextUrl.searchParams.get('deleteFiles') === 'true';

  try {
    const { id } = await params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: { tracks: true }
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Delete all track files if requested
    if (deleteFiles) {
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
