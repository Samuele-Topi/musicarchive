"use client";

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ArtistHeader({ name, initialImageUrl }: { name: string, initialImageUrl?: string | null }) {
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

  return (
    <div className="flex items-center gap-6 mb-8">
      <div className="relative group w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-md border-4 border-white dark:border-black">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🎤</div>
          )}
        </div>
        
        {/* Edit Overlay */}
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer">
           {isUploading ? <Loader2 className="animate-spin" /> : <Camera />}
           <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
        </label>
      </div>

      <div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter dark:text-white">{name}</h1>
        <p className="text-zinc-500 mt-2 text-lg">Artist</p>
      </div>
    </div>
  );
}
