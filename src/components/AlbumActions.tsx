"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AlbumActions({ albumId }: { albumId: string }) {
  const router = useRouter();

  const handleDeleteAlbum = async () => {
    if (!confirm("Are you sure you want to delete this ENTIRE album and all its files? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/album/${albumId}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Album deleted successfully.");
        router.push('/');
        router.refresh();
      } else {
        alert("Failed to delete album.");
      }
    } catch (e) {
      alert("Error deleting album.");
    }
  };

  return (
    <button
      onClick={handleDeleteAlbum}
      className="flex items-center gap-2 text-red-500 hover:text-red-600 transition hover:underline"
      title="Delete Album"
    >
      <Trash2 size={16} /> Delete Album
    </button>
  );
}
