import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';
import { auth } from '@/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

function sanitize(str: string): string {
  return str.replace(/[^a-z0-9\-_ ]/gi, '').trim();
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Base music directory
    const baseDir = path.join(process.cwd(), 'public', 'music');

    const results = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await mm.parseBuffer(buffer, file.type);
      
      const { common, format } = metadata;
      const title = common.title || file.name.replace(/\.[^/.]+$/, "");
      
      const rawArtist = common.artist || "Unknown Artist";
      const mainArtist = rawArtist.split(/,|\//)[0].trim();
      const albumName = common.album || "Unknown Album";
      const year = common.year || new Date().getFullYear();
      const duration = format.duration || 0;
      const trackNumber = common.track.no || 0;

      // Organize: public/music/Artist/Album/
      const safeArtist = sanitize(mainArtist);
      const safeAlbum = sanitize(albumName);
      const safeTitle = sanitize(title);
      
      const artistDir = path.join(baseDir, safeArtist);
      const albumDir = path.join(artistDir, safeAlbum);
      
      if (!fs.existsSync(albumDir)) {
        await mkdir(albumDir, { recursive: true });
      }

      const fileName = `${safeTitle}${path.extname(file.name)}`;
      const filePath = path.join(albumDir, fileName);
      
      // Save file
      await writeFile(filePath, buffer);
      
      // Store relative path for serving
      const fileUrl = `/music/${safeArtist}/${safeAlbum}/${fileName}`;

      // Database Operations
      let album = await prisma.album.findFirst({
        where: { title: albumName, artist: mainArtist }
      });

      if (!album) {
        album = await prisma.album.create({
          data: {
            title: albumName,
            artist: mainArtist,
            year: year,
            // We will set coverUrl dynamically after ID is known, 
            // but actually we can just set it now assuming the endpoint pattern
            // However, we need the album ID for the endpoint.
            // So we create first.
          }
        });
        
        // Update with dynamic cover URL
        const dynamicCoverUrl = `/api/cover/album/${album.id}`;
        album = await prisma.album.update({
            where: { id: album.id },
            data: { coverUrl: dynamicCoverUrl }
        });
      }

      // Create Track
      const track = await prisma.track.create({
        data: {
          title: title,
          artist: rawArtist,
          fileUrl: fileUrl,
          duration: duration,
          trackNumber: trackNumber,
          albumId: album.id
        }
      });

      results.push(track);
    }

    return NextResponse.json({ message: 'Upload successful', tracks: results });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
