import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const legacySupabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || legacySupabaseKey;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY in environment variables');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_KEY) in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && legacySupabaseKey && process.env.NODE_ENV !== 'production') {
  console.warn('[env] SUPABASE_KEY is deprecated. Please switch to SUPABASE_SERVICE_ROLE_KEY.');
}

const baseClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

let adminClient;

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, baseClientOptions);
  }

  return adminClient;
}

export function getSupabaseUser(accessToken) {
  const options = { ...baseClientOptions };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, options);
}
