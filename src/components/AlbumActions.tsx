"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function AlbumActions({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async (deleteFiles: boolean) => {
    try {
      const res = await fetch(`/api/album/${albumId}?deleteFiles=${deleteFiles}`, { method: 'DELETE' });
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
    <>
      <button
        onClick={() => setIsDeleting(true)}
        className="flex items-center gap-2 text-red-500 hover:text-red-600 transition hover:underline"
        title="Delete Album"
      >
        <Trash2 size={16} /> Delete Album
      </button>

      <DeleteConfirmModal 
         isOpen={isDeleting}
         onClose={() => setIsDeleting(false)}
         onConfirm={handleConfirmDelete}
         title="Delete Album"
         message="Are you sure you want to delete this album? This will remove all tracks associated with it."
      />
    </>
  );
}
