import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  // Reconstruct relative path from URL segments
  // e.g. /music/Artist/Album/Song.mp3 -> pathSegments = ['Artist', 'Album', 'Song.mp3']
  const relativePath = pathSegments.join(path.sep);
  
  const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');
  const filePath = path.join(musicDir, relativePath);

  // Security check: Ensure we don't traverse up
  if (!filePath.startsWith(musicDir)) {
      return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
        return new NextResponse("Not Found", { status: 404 });
    }

    // Handle Range Headers for seeking
    const range = request.headers.get('range');
    const fileSize = stats.size;
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ogg') contentType = 'audio/ogg';
    else if (ext === '.flac') contentType = 'audio/flac';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // @ts-ignore: Next.js Stream/Response type compatibility
      return new NextResponse(fileStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    } else {
      const fileStream = fs.createReadStream(filePath);
      // @ts-ignore
      return new NextResponse(fileStream, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
        },
      });
    }

  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
