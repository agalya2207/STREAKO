const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_DEFAULT_URL = 'https://tdnkoixpqmmakliiqfqe.supabase.co';
// Use service role key for all server-side auth operations (signInWithPassword works with service key)
const SUPABASE_DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbmtvaXhwcW1tYWtsaWlxZnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5OTk2MiwiZXhwIjoyMTAzNjc1OTYyfQ.tSl26PX8sebJCK-47O40sD1j1cHNxI8Gn-_3ynlDtHQ';

function cleanEnv(val) {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

let supabaseUrl = cleanEnv(process.env.SUPABASE_URL);
if (!supabaseUrl || supabaseUrl.includes('liiiq') || !supabaseUrl.includes('.supabase.co') || !supabaseUrl.startsWith('http')) {
  supabaseUrl = SUPABASE_DEFAULT_URL;
}

// Prefer service role key (works for signInWithPassword on server side)
let supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnv(process.env.SUPABASE_ANON_KEY);
if (!supabaseKey || supabaseKey.includes('...') || supabaseKey.length < 50) {
  supabaseKey = SUPABASE_DEFAULT_KEY;
}

// This client is used for auth operations (signup, login)
const supabaseAuthClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabaseAuthClient;

