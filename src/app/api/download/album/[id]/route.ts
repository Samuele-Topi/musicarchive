import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // This line changed
) {
  // 1. Authenticate user
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params; // No await here

    // 2. Fetch album details and associated tracks
    const album = await prisma.album.findUnique({
      where: { id },
      include: { tracks: true },
    });

    if (!album) {
      return new NextResponse('Album not found', { status: 404 });
    }

    if (album.tracks.length === 0) {
      return new NextResponse('No tracks found for this album', { status: 404 });
    }

    const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');

    // Create a new archiver instance
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // Pipe archive data to a temporary stream or directly to response
    // For Next.js, we need to convert it to a ReadableStream or similar
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err) => controller.error(err));
      }
    });

    // Add tracks to the archive
    for (const track of album.tracks) {
      const filePath = path.join(musicDir, track.fileUrl);

      // Security check: Ensure we don't traverse up
      if (!filePath.startsWith(musicDir)) {
        console.warn(`Attempted path traversal for track: ${track.fileUrl}`);
        continue; // Skip this track, but don't fail the entire archive
      }

      try {
        const fileStat = fs.statSync(filePath); // Use sync for stat in loop or refactor
        if (fileStat.isFile()) {
            const fileNameInZip = path.join(album.artist, album.title, path.basename(filePath));
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
    const albumFileName = `${album.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
    return new NextResponse(stream as any, { // Cast to any
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${albumFileName}"`,
      },
    });

  } catch (error) {
    console.error('Album download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
}
