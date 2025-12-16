"use client";

import { useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ArtistHeader({ name, initialImageUrl, isAuthenticated, bio }: { name: string, initialImageUrl?: string | null, isAuthenticated: boolean, bio?: string | null }) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('artistName', name);

    try {
      const res = await fetch('/api/artist/image', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDiscography = async () => {
    if (!confirm(`Are you sure you want to delete ALL albums and tracks by ${name}? This cannot be undone.`)) return;

    try {
        const res = await fetch(`/api/artist/${encodeURIComponent(name)}`, { method: 'DELETE' });
        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            router.push('/');
            router.refresh();
        } else {
            alert("Failed to delete discography.");
        }
    } catch (e) {
        alert("Error deleting discography.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
      <div className="relative group w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-md border-4 border-white dark:border-black">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🎤</div>
          )}
        </div>
        
        {/* Edit Overlay */}
        {isAuthenticated && (
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer">
             {isUploading ? <Loader2 className="animate-spin" /> : <Camera />}
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
        )}
      </div>

      <div className="text-center md:text-left flex-grow">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter dark:text-white">{name}</h1>
        <p className="text-zinc-500 mt-2 text-lg">Artist</p>
        {bio && (
          <p className="text-zinc-600 dark:text-zinc-400 mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-wrap">
            {bio}
          </p>
        )}
        
        {isAuthenticated && (
             <button
                onClick={handleDeleteDiscography}
                className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-600 transition text-sm font-medium hover:underline mx-auto md:mx-0"
                title="Delete Entire Discography"
             >
                 <Trash2 size={16} /> Delete Discography
             </button>
         )}
      </div>
    </div>
  );
}
