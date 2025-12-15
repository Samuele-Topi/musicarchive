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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const results = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await mm.parseBuffer(buffer, file.type);
      
      const { common, format } = metadata;
      const title = common.title || file.name.replace(/\.[^/.]+$/, "");
      
      // Artist Logic:
      // If comma separated, take the first one for the Album Artist (grouping)
      // Keep the full string for the Track Artist (display)
      const rawArtist = common.artist || "Unknown Artist";
      const mainArtist = rawArtist.split(/,|\//)[0].trim(); // Split by comma or slash
      
      const albumName = common.album || "Unknown Album";
      const year = common.year || new Date().getFullYear();
      const duration = format.duration || 0;
      const trackNumber = common.track.no || 0;

      // Handle Cover Art
      let coverUrl = null;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        const coverFileName = `${mainArtist}-${albumName}-${Date.now()}.jpg`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const coverPath = path.join(uploadDir, coverFileName);
        await writeFile(coverPath, picture.data);
        coverUrl = `/uploads/${coverFileName}`;
      }

      // Save Audio File
      const fileName = `${mainArtist}-${title}-${Date.now()}${path.extname(file.name)}`.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      const fileUrl = `/uploads/${fileName}`;

      // Database Operations
      // Find or Create Album using mainArtist
      let album = await prisma.album.findFirst({
        where: { title: albumName, artist: mainArtist }
      });

      if (!album) {
        album = await prisma.album.create({
          data: {
            title: albumName,
            artist: mainArtist,
            year: year,
            coverUrl: coverUrl
          }
        });
      } else if (!album.coverUrl && coverUrl) {
         // Update cover if it was missing
         album = await prisma.album.update({
            where: { id: album.id },
            data: { coverUrl }
         });
      }

      // Create Track with rawArtist (includes features)
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
