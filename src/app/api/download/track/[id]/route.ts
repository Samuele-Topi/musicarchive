import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { auth } from '@/auth';

const stat = promisify(fs.stat);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate user
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // 2. Fetch track details
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return new NextResponse('Track not found', { status: 404 });
    }

    // 3. Construct full file path
    const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');
    const filePath = path.join(musicDir, track.fileUrl); // Assuming track.fileUrl is relative to musicDir

    // Security check: Ensure we don't traverse up
    if (!filePath.startsWith(musicDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 4. Check if file exists
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);

    // 5. Send file with appropriate headers for download
    // @ts-ignore: Next.js Stream/Response type compatibility
    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': 'application/octet-stream', // Generic binary file type
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    console.error('Single track download error:', error);
    return new NextResponse('Download failed', { status: 500 });
  }
}
