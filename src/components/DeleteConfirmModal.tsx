"use client";

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteFiles: boolean) => Promise<void>;
  title: string;
  message: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async (deleteFiles: boolean) => {
    setIsDeleting(true);
    await onConfirm(deleteFiles);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-col gap-3">
             <button
               onClick={() => handleConfirm(false)}
               disabled={isDeleting}
               className="w-full py-3 px-4 rounded-lg font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition flex items-center justify-center gap-2"
             >
               {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Remove from Library Only (Keep Files)"}
             </button>
             
             <button
               onClick={() => handleConfirm(true)}
               disabled={isDeleting}
               className="w-full py-3 px-4 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2 shadow-sm shadow-red-500/20"
             >
               {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Delete Files & Library Entry (Permanent)"}
             </button>

             <button 
               onClick={onClose}
               disabled={isDeleting}
               className="mt-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
