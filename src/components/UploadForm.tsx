"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UploadForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadStatus('success');
        setFiles([]);
      } else {
        setUploadStatus('error');
      }
    } catch (e) {
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div 
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white dark:bg-zinc-900",
          isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <UploadCloud size={48} className="text-zinc-400 mb-4" />
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">Drag & drop music files here</p>
        <p className="text-sm text-zinc-500 mt-2">or click to select files</p>
        <input 
          id="fileInput" 
          type="file" 
          multiple 
          accept="audio/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
           <h3 className="font-semibold mb-2">Selected Files ({files.length})</h3>
           <ul className="text-sm text-zinc-500 max-h-40 overflow-y-auto space-y-1">
             {files.map((f, i) => (
               <li key={i} className="truncate">• {f.name}</li>
             ))}
           </ul>
           <button 
             onClick={uploadFiles} 
             disabled={isUploading}
             className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
           >
             {isUploading && <Loader2 className="animate-spin" size={16} />}
             {isUploading ? "Uploading..." : "Upload Music"}
           </button>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
           <CheckCircle size={20} />
           Upload successful! Your library has been updated.
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
           <AlertCircle size={20} />
           Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}
