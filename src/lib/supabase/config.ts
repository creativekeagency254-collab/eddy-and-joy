const DEFAULT_SUPABASE_URL = 'http://127.0.0.1:54321';
const DEFAULT_PUBLIC_KEY = 'public-anon-key';

export function getSupabaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required in production.');
  }

  return DEFAULT_SUPABASE_URL;
}

export function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    DEFAULT_PUBLIC_KEY
  );
}

export function getSupabaseServiceKey() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();

  if (serviceKey) {
    return serviceKey;
  }

  throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) is required.');
}

export const SUPABASE_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'products';

export const SUPABASE_REVIEWS_TABLE =
  process.env.NEXT_PUBLIC_SUPABASE_REVIEWS_TABLE?.trim() || 'reviews';
