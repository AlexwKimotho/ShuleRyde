const { createClient } = require('@supabase/supabase-js');

// persistSession: false ensures signInWithPassword calls don't overwrite
// the service-role key context — subsequent .from() queries always use
// the service role and correctly bypass RLS.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;
