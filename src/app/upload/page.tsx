import UploadForm from '@/components/UploadForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function UploadPage() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
      <header className="mb-8">
        <a href="/" className="text-sm font-medium hover:underline text-zinc-500 mb-4 inline-block">&larr; Back to Library</a>
        <h1 className="text-3xl font-bold tracking-tight">Upload Music</h1>
        <p className="text-zinc-500">Add new tracks to your archive.</p>
      </header>
      
      <UploadForm />
    </main>
  );
}
