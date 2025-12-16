export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { watchLibrary } = await import('@/lib/sync');
    watchLibrary();
  }
}
