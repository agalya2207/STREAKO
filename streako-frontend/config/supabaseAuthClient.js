const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key. Check your .env file.');
  process.exit(1);
}

// This client uses the anon/publishable key - safe for auth operations (signup, login)
const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabaseAuthClient;