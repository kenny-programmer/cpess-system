import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const admin = {
  email: 'cpess.admin@gmail.com',
  password: '12341234',
  name: 'CPESS Administrator',
  role: 'admin'
};

const officers = [
  { email: 'cpess.president@gmail.com', password: 'cpessPres!dent2024', name: 'Paul Alfred Manongsong', position: 'President' },
  { email: 'cpess.vpinternal@gmail.com', password: 'cpessVPintern@l2024', name: 'Niña Kristal Malaluan', position: 'VP Internal' },
  { email: 'cpess.vpexternal@gmail.com', password: 'cpessVPextern@l2024', name: 'Lei Allizter Cervantes', position: 'VP External' },
  { email: 'cpess.treasurer@gmail.com', password: 'cpessTreasur3r2024', name: 'Jyenn Lee Cabrera', position: 'Treasurer' },
  { email: 'cpess.asst.treasurer@gmail.com', password: 'cpessAsstTreas2024', name: 'Madeline Dela Torre', position: 'Assistant Treasurer' },
  { email: 'cpess.auditor@gmail.com', password: 'cpessAud!tor2024', name: 'Alejandro Miguel Sandoval', position: 'Auditor' },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
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

    const results = [];

    // Create admin account first
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', admin.email)
      .maybeSingle();

    if (!existingAdmin) {
      const { data: adminAuthData, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
      });

      if (!adminAuthError && adminAuthData.user) {
        const { error: adminUserError } = await supabaseAdmin.from('users').insert({
          id: adminAuthData.user.id,
          email: admin.email,
          role: 'admin',
          officer_position: null,
          full_name: admin.name,
          is_active: true,
        });

        if (!adminUserError) {
          results.push({ email: admin.email, status: 'created', name: admin.name, role: 'admin' });
        } else {
          results.push({ email: admin.email, status: 'error', error: adminUserError.message });
        }
      } else {
        results.push({ email: admin.email, status: 'error', error: adminAuthError?.message });
      }
    } else {
      results.push({ email: admin.email, status: 'already exists', role: 'admin' });
    }

    // Create officer accounts
    for (const officer of officers) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', officer.email)
        .maybeSingle();

      if (existingUser) {
        results.push({ email: officer.email, status: 'already exists' });
        continue;
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: officer.email,
        password: officer.password,
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: officer.email, status: 'error', error: authError.message });
        continue;
      }

      if (authData.user) {
        const { error: userError } = await supabaseAdmin.from('users').insert({
          id: authData.user.id,
          email: officer.email,
          role: 'officer',
          officer_position: officer.position,
          full_name: officer.name,
          is_active: true,
        });

        if (userError) {
          results.push({ email: officer.email, status: 'error', error: userError.message });
        } else {
          results.push({ email: officer.email, status: 'created', name: officer.name });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
