import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs'; // Use fs directly for createReadStream
import path from 'path';
import { promisify } from 'util'; // Keep promisify for fs.stat
import { getMusicFilePath } from '@/lib/serverUtils';

const stat = promisify(fs.stat);

// Helper to determine content type
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    case '.flac': return 'audio/flac';
    case '.m4a': return 'audio/mp4';
    case '.aac': return 'audio/aac';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // Await params here

    // 2. Fetch track details
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return new NextResponse('Track not found', { status: 404 });
    }

    // 3. Construct full file path
    const filePath = getMusicFilePath(track.fileUrl);

    // 4. Check if file exists
    try {
        const stats = await stat(filePath);
        if (!stats.isFile()) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase(); // Get extension for logging
        const contentType = getContentType(filePath);

        console.log('--- Single Track Download Debug ---');
        console.log('filePath:', filePath);
        console.log('fileName:', fileName);
        console.log('ext:', ext);
        console.log('contentType:', contentType);
        console.log('-----------------------------------');

        const fileStream = fs.createReadStream(filePath);

        const readableWebStream = new ReadableStream({
            start(controller) {
                fileStream.on('data', (chunk) => controller.enqueue(chunk));
                fileStream.on('end', () => controller.close());
                fileStream.on('error', (err) => controller.error(err));
            },
            cancel() {
                fileStream.destroy();
            }
        });

        // 5. Send file with appropriate headers for download
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        headers.set('Content-Length', stats.size.toString());

        // @ts-ignore: Next.js Stream/Response type compatibility
        return new NextResponse(readableWebStream, { headers });
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return new NextResponse('File not found', { status: 404 });
        }
        throw err;
    }

  } catch (error: any) {
    console.error('Single track download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
}
