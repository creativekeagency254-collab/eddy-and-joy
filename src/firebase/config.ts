export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'missing-supabase-key',
  authDomain: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing-supabase-url',
  projectId: process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase-project',
};
