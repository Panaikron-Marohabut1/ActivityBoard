const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Missing Supabase environment variables!');
    console.error('Please create a .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key (for server-side operations)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Create Supabase client with anon key (for client-like operations)
const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = {
    supabase,
    supabaseAnon
};
