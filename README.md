# 🎶 Music Archive 🎶

_Your personal, aesthetic, and perfectly organized music haven._

Built with the modern web stack: Next.js 🚀, Tailwind CSS ✨, and Prisma 🐘.

## ✨ Features

- **📂 Smart Library Sync**: Automatically scans your local `public/music` folder and populates your database. No more manual track entry!
- **⬆️ Effortless Uploads**: Drag & drop MP3 files, and watch them organize themselves into `public/music/{Artist}/{Album}/`.
- **🖼️ Rich Metadata & Dynamic Covers**: All cover art and track details are read directly from your MP3s' ID3 tags. Beautifully displayed, no extra files!
- **🌐 Intuitive Browsing**: Explore your collection in a gorgeous album grid, or switch to detailed track and artist views.
- **▶️ Seamless Playback**: A persistent global player with queue management keeps the music flowing.
- **🔍 Quick Search**: Find your favorite tunes by artist, album, or track name in an instant.

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

### Synchronizing Your Existing Library
1.  Ensure your MP3s are correctly linked or copied into `public/music`.
2.  **Authenticate**: Log in to access administrative features.
3.  Click the **Sync** button (🔄 icon) next to the search bar.
4.  Watch as your entire collection is magically added to the database!

### Uploading New Tracks
1.  Navigate to the dedicated `/upload` page.
2.  **Authenticate**: Log in to upload new files.
3.  Simply drag and drop your MP3s. They will be automatically organized and stored.

### Managing Artist Images
-   **Authenticated users** can upload artist images directly from the artist's page by hovering over the placeholder/existing image and clicking the camera icon.

## 🏗️ Architecture Under the Hood

-   **Frontend Framework**: Next.js 15 (App Router)
-   **Styling**: Tailwind CSS v4 for a sleek, modern look.
-   **Database**: SQLite for simplicity and speed, powered by Prisma ORM.
-   **Audio Playback**: Robust HTML5 Audio API via a custom React Hook.
-   **File Storage**:
    -   Music files reside in `public/music` (organized by Artist/Album).
    -   Artist profile images are stored in `public/uploads/artists`.
    -   Album covers are **dynamically extracted** from your MP3 files' ID3 tags – no redundant image files!

## ⚠️ Important Notes

-   **Authentication is Key**: Actions like uploading music, syncing the library, and managing artist images require user authentication. This ensures your library remains personal and secure.
-   **Git & Storage**: Your `public/music` (the actual MP3s) and `public/uploads` (artist images) directories are **ignored by Git**. This keeps your repository lightweight and prevents accidental pushes of large media files. Your precious music stays exactly where you want it!