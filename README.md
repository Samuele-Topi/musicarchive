# Music Archive

A personal, aesthetic music archive built with Next.js, Tailwind CSS, and Prisma.

## Features

- **Upload**: Drag and drop MP3 files to add them to your library. Metadata (Artist, Album, Cover Art) is automatically extracted.
- **Library**: Browse albums in a beautiful grid layout.
- **Album Details**: View detailed information about an album, including track list, total duration, and release year.
- **Player**: Persistent global music player with queue management.
- **Search**: (Coming soon) Filter by artist or album.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Initialize Database**:
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open Browser**:
    Go to `http://localhost:3000`.

## Usage

1.  Navigate to `/upload` (click "Upload Music" in the header).
2.  Drag and drop MP3 files. They will be uploaded to `public/uploads` and added to the SQLite database.
3.  Go back to the home page to see your albums.
4.  Click an album to play it.

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Audio**: HTML5 Audio API via Custom React Hook
- **File Storage**: Local filesystem (`public/uploads`)

## Notes

- This is designed for personal use (single user upload).
- Ensure `public/uploads` is writable.