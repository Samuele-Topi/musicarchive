# Music Archive

A personal, aesthetic music archive built with Next.js, Tailwind CSS, and Prisma.

## Features

- **Sync Library**: Automatically scan your local `public/music` folder to populate the database.
- **Upload**: Drag and drop MP3 files to add them to your library. Files are automatically organized into `public/music/Artist/Album/`.
- **Metadata-Driven**: Cover art and track info are read directly from MP3 ID3 tags.
- **Library**: Browse albums in a beautiful grid layout or switch to Track/Artist views.
- **Player**: Persistent global music player with queue management.
- **Search**: Filter by artist, album, or track name.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Initialize Database**:
    ```bash
    npx prisma migrate dev
    ```

3.  **Configure Music Folder**:
    - The app looks for music in `public/music`.
    - **Recommended**: Create a junction/symlink to your existing music library:
      ```powershell
      # PowerShell (Admin)
      New-Item -ItemType Junction -Path "public/music" -Target "C:\Path\To\Your\Music"
      ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open Browser**:
    Go to `http://localhost:3000`.

## Usage

### Syncing Existing Music
1.  Ensure your music files are accessible in `public/music` (via copy or symlink).
2.  Log in (if authentication is enabled).
3.  Click the **Sync** button (refresh icon) next to the search bar.
4.  The app will scan recursively and add new tracks to the database.

### Uploading New Music
1.  Navigate to the `/upload` page.
2.  Drag and drop MP3 files.
3.  Files are automatically renamed and moved to `public/music/{Artist}/{Album}/{Title}.mp3`.

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Audio**: HTML5 Audio API via Custom React Hook
- **File Storage**:
    - Music: `public/music` (Organized by Artist/Album)
    - Artist Images: `public/uploads/artists`
    - Album Covers: Served dynamically from MP3 metadata (no separate files).

## Notes

- **Git & Backup**:
    - `public/music` and `public/uploads` are **ignored** by Git to keep the repo light.
    - Your actual music files stay on your disk (or linked location).
