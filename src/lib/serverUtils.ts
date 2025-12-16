import path from 'path';

export function getMusicFilePath(fileUrl: string): string {
    const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');
    
    // fileUrl is typically like "/music/Artist/Album/Song.mp3"
    // We want to remove the "/music" prefix to get the path relative to the actual music directory
    let relativePath = fileUrl;
    if (relativePath.startsWith('/music')) {
        relativePath = relativePath.substring(6);
    }
    
    // Remove leading slash to ensure path.join treats it as relative
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
        relativePath = relativePath.substring(1);
    }
    
    return path.join(musicDir, relativePath);
}
