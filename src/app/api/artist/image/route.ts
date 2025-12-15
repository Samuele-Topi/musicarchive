import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const artistName = formData.get('artistName') as string;

    if (!file || !artistName) {
      return NextResponse.json({ error: 'Missing file or artist name' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `artist-${artistName}-${Date.now()}.jpg`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    const artistInfo = await prisma.artistInfo.upsert({
      where: { name: artistName },
      update: { imageUrl: fileUrl },
      create: { name: artistName, imageUrl: fileUrl }
    });

    return NextResponse.json({ imageUrl: fileUrl });
  } catch (error) {
    console.error('Artist image upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
