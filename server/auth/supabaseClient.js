import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { logger } from '../utils/logger.js';

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
  logger.warn('config.env.deprecated_supabase_key', {
    variable: 'SUPABASE_KEY',
    replacement: 'SUPABASE_SERVICE_ROLE_KEY',
  });
}

const baseClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

let adminClient;
let testSupabaseClients = null;

export function setSupabaseClientsForTest(clients) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setSupabaseClientsForTest can only be used in test environment');
  }

  testSupabaseClients = clients || null;
}

export function resetSupabaseClientsForTest() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetSupabaseClientsForTest can only be used in test environment');
  }

  testSupabaseClients = null;
}

export function getSupabaseAdmin() {
  if (testSupabaseClients?.admin) {
    return testSupabaseClients.admin;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, baseClientOptions);
  }

  return adminClient;
}

export function getSupabaseUser(accessToken) {
  if (testSupabaseClients?.user) {
    return typeof testSupabaseClients.user === 'function'
      ? testSupabaseClients.user(accessToken)
      : testSupabaseClients.user;
  }

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
