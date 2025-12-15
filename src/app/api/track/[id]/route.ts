import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';

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

    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', track.fileUrl);
    try {
        await unlink(filePath);
    } catch (e) {
        console.warn("File deletion failed, might not exist:", filePath);
    }

    // Delete from DB
    await prisma.track.delete({
      where: { id },
    });
    
    // Check if album is empty, if so, delete it
    if (track.albumId) {
        const remainingTracks = await prisma.track.count({
            where: { albumId: track.albumId }
        });
        if (remainingTracks === 0) {
             const album = await prisma.album.findUnique({ where: { id: track.albumId } });
             if (album && album.coverUrl) {
                 const coverPath = path.join(process.cwd(), 'public', album.coverUrl);
                 try {
                    await unlink(coverPath);
                 } catch (e) {
                     console.warn("Cover deletion failed:", coverPath);
                 }
             }
             await prisma.album.delete({ where: { id: track.albumId } });
        }
    }

    return NextResponse.json({ message: 'Track deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
