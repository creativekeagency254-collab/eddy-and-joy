import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceKey, getSupabaseUrl } from '@/lib/supabase/config';

let serviceClient: SupabaseClient | null = null;

export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceClient;
}
