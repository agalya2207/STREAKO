const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_DEFAULT_URL = 'https://tdnkoixpqmmakliiqfqe.supabase.co';
const SUPABASE_DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbmtvaXhwcW1tYWtsaWlxZnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5OTk2MiwiZXhwIjoyMTAzNjc1OTYyfQ.tSl26PX8sebJCK-47O40sD1j1cHNxI8Gn-_3ynlDtHQ';

let supabaseUrl = (process.env.SUPABASE_URL || '').trim();
if (!supabaseUrl || !supabaseUrl.includes('.supabase.co') || !supabaseUrl.startsWith('http')) {
  supabaseUrl = SUPABASE_DEFAULT_URL;
}

let supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!supabaseServiceKey || supabaseServiceKey.includes('...') || supabaseServiceKey.length < 50) {
  supabaseServiceKey = SUPABASE_DEFAULT_SERVICE_KEY;
}

// This client uses the service_role key - full access, backend-only, never expose to frontend
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;

