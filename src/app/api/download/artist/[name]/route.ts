import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } } // This line changed
) {
  // 1. Authenticate user
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = params; // No await here
    const decodedName = decodeURIComponent(name);

    // 2. Fetch all tracks for the artist
    const tracks = await prisma.track.findMany({
      where: {
        OR: [
          { artist: { contains: decodedName } },
          { album: { artist: decodedName } }
        ]
      },
      include: {
        album: true, // Include album to get album title for file structure in zip
      },
    });

    if (tracks.length === 0) {
      return new NextResponse(`No tracks found for artist: ${decodedName}`, { status: 404 });
    }

    const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');

    // Create a new archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // Pipe archive data to a temporary stream or directly to response
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err) => controller.error(err));
      }
    });

    // Add tracks to the archive
    for (const track of tracks) {
      if (!track.fileUrl) {
        console.warn(`Track ${track.title} has no fileUrl. Skipping.`);
        continue;
      }
      const filePath = path.join(musicDir, track.fileUrl);

      // Security check: Ensure we don't traverse up
      if (!filePath.startsWith(musicDir)) {
        console.warn(`Attempted path traversal for track: ${track.fileUrl}`);
        continue; // Skip this track, but don't fail the entire archive
      }

      try {
        const fileStat = fs.statSync(filePath); // Use sync for stat in loop or refactor
        if (fileStat.isFile()) {
            const albumTitle = track.album?.title || 'Unknown Album';
            const fileNameInZip = path.join(decodedName, albumTitle, path.basename(filePath));
            archive.file(filePath, { name: fileNameInZip });
        }
      } catch (fileError: any) {
        if (fileError.code === 'ENOENT') {
            console.warn(`File not found for track ${track.title}: ${filePath}`);
        } else {
            console.error(`Error adding track ${track.title} to archive:`, fileError);
        }
      }
    }

    archive.finalize();

    // Set appropriate headers for download
    const artistFileName = `${decodedName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
    return new NextResponse(stream as any, { // Cast to any
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${artistFileName}"`,
      },
    });

  } catch (error) {
    console.error('Artist download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
}
