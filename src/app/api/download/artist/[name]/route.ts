import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { auth } from '@/auth';
import stream from 'stream'; // Import stream
import { getMusicFilePath } from '@/lib/serverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  // 1. Authenticate user
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await params; // Await params here
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

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    const passThrough = new stream.PassThrough();
    archive.pipe(passThrough);

    // Add tracks to the archive
    for (const track of tracks) {
      if (!track.fileUrl) {
        console.warn(`Track ${track.title} has no fileUrl. Skipping.`);
        continue;
      }
      const filePath = getMusicFilePath(track.fileUrl);

      try {
        const fileStat = fs.statSync(filePath);
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

    // Convert Node.js PassThrough stream to Web ReadableStream
    const readableWebStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => controller.enqueue(chunk));
        passThrough.on('end', () => controller.close());
        passThrough.on('error', (err) => controller.error(err));
      },
      cancel() {
        passThrough.destroy();
      }
    });

    // Set appropriate headers for download
    const artistFileName = `${decodedName.replace(/[^a-z0-9\s]/gi, '_').toLowerCase()}.zip`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${artistFileName}"`);
    headers.set('Transfer-Encoding', 'chunked'); // Important for streaming downloads

    // @ts-ignore: Next.js Stream/Response type compatibility
    return new NextResponse(readableWebStream, { headers });

  } catch (error) {
    console.error('Artist download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
}
