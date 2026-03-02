const DEFAULT_SUPABASE_URL = 'http://127.0.0.1:54321';
const DEFAULT_PUBLIC_KEY = 'public-anon-key';

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
}

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    DEFAULT_PUBLIC_KEY
  );
}

export function getSupabaseServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    DEFAULT_PUBLIC_KEY
  );
}

export const SUPABASE_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'products';

export const SUPABASE_REVIEWS_TABLE =
  process.env.NEXT_PUBLIC_SUPABASE_REVIEWS_TABLE?.trim() || 'reviews';
