import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const album = await prisma.album.findUnique({
      where: { id },
      include: { tracks: { take: 1 } }
    });

    if (!album || album.tracks.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    const track = album.tracks[0];
    // fileUrl is relative (e.g. /music/Artist/Album/Song.mp3)
    // We need absolute path.
    const filePath = path.join(process.cwd(), 'public', track.fileUrl);

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return new NextResponse(null, { status: 404 });
    }

    const metadata = await mm.parseFile(filePath);
    const picture = metadata.common.picture?.[0];

    if (!picture) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(picture.data, {
      headers: {
        'Content-Type': picture.format,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error serving cover:', error);
    return new NextResponse(null, { status: 500 });
  }
}
