import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

// 1. Fixed CORS headers (lowercase is safer for Supabase standard headers)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // 2. Handle Preflight Options Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminEmail = 'cpess.admin@admin.com';
    const adminPassword = '12341234';

    // Check if user entry exists (handled gracefully if table is missing)
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    // If the table 'users' does not exist, this error will trigger.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Table fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: `Database error: ${fetchError.message}. Does the 'users' table exist?` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ message: 'Admin already exists' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'CPESS Administrator' }
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert into public users table
    if (authData.user) {
      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email: adminEmail,
        role: 'admin',
        officer_position: null,
        full_name: 'CPESS Administrator',
        is_active: true,
      });

      if (userError) {
        // If insert fails (e.g., table missing), cleanup the auth user so we can try again
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return new Response(
          JSON.stringify({ error: `Failed to create user profile: ${userError.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin account created',
        email: adminEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});