# 🎶 Music Archive 🎶

_Your personal, aesthetic, and perfectly organized music haven._

Built with the modern web stack: Next.js 🚀, Tailwind CSS ✨, and Prisma 🐘.

## ✨ Features

- **📂 Automatic Background Sync**: The app watches your `public/music` folder in real-time. Just drop your files, and they appear in the library instantly!
- **⬆️ Effortless Uploads**: Drag & drop MP3 files via the UI, or manage the folder directly.
- **🖼️ Rich Metadata & Covers**: All album cover art and track details are read directly from your MP3s' ID3 tags.
- **✏️ Metadata Editor**: Fix incorrect tags directly in the app (Admin only).
- **📦 Smart Downloads**: Download full albums or artist discographies as ZIP files, or grab individual tracks with ease.
- **🌐 Intuitive Browsing**: Explore your collection in a gorgeous album grid, or switch to detailed track and artist views.
- **▶️ Seamless Playback**: A persistent global player with queue management keeps the music flowing.
- **🔍 Advanced Search & Filtering**: Filter your library by **Genre**, **Year**, or keyword to find exactly what you want.

## 🚀 Getting Started

Setting up your personal music sanctuary is easy!

1.  **Dependencies Installation**:
    ```bash
    npm install
    ```

2.  **Database Initialization**:
    ```bash
    npx prisma migrate dev
    ```

3.  **Configure Music Folder**:
    -   The app needs to know where your music is stored.
    -   Open `.env` (create it if missing) and add:
        ```env
        MUSIC_DIR="C:\Path\To\Your\Music"
        ```
    -   *(No need to put files in `public/music` anymore!)*

4.  **Launch Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open in Browser**:
    Your musical journey begins at `http://localhost:3000`.

## ⚙️ Usage

### Synchronizing Your Library
-   **Automatic**: The app now monitors your music folder for changes. Add or remove files, and the library updates automatically.
-   **Manual**: You can still click the **Sync** button (🔄 icon) next to the search bar to force a rescan if needed.

### Browsing & Filtering
-   **Search**: Type in the search bar to filter by artist, album, or track name.
-   **Advanced Filters**: Click the **Filter icon** next to the search bar to filter by **Genre** or **Year**.

### Editing Metadata
-   **Authenticated Users** can edit track details.
-   Hover over a track and click the **Edit icon** (pencil) to modify the Title, Artist, Genre, or Track Number.

### Uploading New Tracks
1.  Navigate to the dedicated `/upload` page.
2.  **Authenticate**: Log in to upload new files.
3.  Simply drag and drop your MP3s. They will be automatically organized and stored.

### Downloading Music
-   **Albums/Artists**: Click the "Download" button on any album or artist page to get a ZIP archive of the tracks.
-   **Single Tracks**: Click the download icon next to any track.

### Managing Artist Images (Manual Upload)
-   Artist images are not automatically fetched. **Authenticated users** can upload artist images directly from the artist's page by hovering over the placeholder/existing image and clicking the camera icon.

## 🏗️ Architecture Under the Hood

-   **Frontend Framework**: Next.js 15 (App Router) with `experimental.instrumentationHook` for background tasks.
-   **Styling**: Tailwind CSS v4 for a sleek, modern look.
-   **Database**: SQLite for simplicity and speed, powered by Prisma ORM.
-   **File Watching**: Powered by `chokidar` for real-time library updates.
-   **Audio Playback**: Robust HTML5 Audio API via a custom React Hook.
-   **File Storage**:
    -   Music files reside in `public/music` (organized by Artist/Album).
    -   Artist profile images are stored in `public/uploads/artists`.
    -   Album covers are **dynamically extracted** from your MP3 files' ID3 tags – no redundant image files!

## ⚠️ Important Notes

-   **Authentication is Key**: Actions like uploading music, syncing the library, and managing artist images require user authentication. This ensures your library remains personal and secure.
-   **Git & Storage**: Your `public/music` (the actual MP3s) and `public/uploads` (artist images) directories are **ignored by Git**. This keeps your repository lightweight and prevents accidental pushes of large media files. Your precious music stays exactly where you want it!