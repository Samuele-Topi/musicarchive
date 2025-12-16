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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, artist, features, genre, trackNumber, albumId, newAlbumTitle } = body;

    let finalAlbumId = albumId;

    // Handle New Album Creation
    if (newAlbumTitle) {
        // Assume album artist is the same as the track artist
        const albumArtist = artist || "Unknown Artist";
        
        // Check if exists first to avoid duplicates
        let album = await prisma.album.findFirst({
            where: { title: newAlbumTitle, artist: albumArtist }
        });

        if (!album) {
            album = await prisma.album.create({
                data: {
                    title: newAlbumTitle,
                    artist: albumArtist,
                    year: new Date().getFullYear(),
                }
            });
            // Update cover placeholder
            await prisma.album.update({
                where: { id: album.id },
                data: { coverUrl: `/api/cover/album/${album.id}` }
            });
        }
        finalAlbumId = album.id;
    }

    const track = await prisma.track.update({
      where: { id },
      data: {
        title,
        artist,
        features: features || null,
        genre: genre || null,
        trackNumber: trackNumber ? parseInt(trackNumber) : undefined,
        albumId: finalAlbumId,
      },
    });

    return NextResponse.json(track);
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
  }
}
