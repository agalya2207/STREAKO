const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_DEFAULT_URL = 'https://tdnkoixpqmmakliiqfqe.supabase.co';
const SUPABASE_DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbmtvaXhwcW1tYWtsaWlxZnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5OTk2MiwiZXhwIjoyMTAzNjc1OTYyfQ.tSl26PX8sebJCK-47O40sD1j1cHNxI8Gn-_3ynlDtHQ';

let supabaseUrl = (process.env.SUPABASE_URL || '').trim();
if (!supabaseUrl || supabaseUrl.includes('localhost') || !supabaseUrl.startsWith('http')) {
  supabaseUrl = SUPABASE_DEFAULT_URL;
}

let supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();
if (!supabaseKey || supabaseKey.includes('...')) {
  supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}
if (!supabaseKey || supabaseKey.includes('...')) {
  supabaseKey = SUPABASE_DEFAULT_KEY;
}

// This client is used for auth operations (signup, login)
const supabaseAuthClient = createClient(supabaseUrl, supabaseKey);

module.exports = supabaseAuthClient;

