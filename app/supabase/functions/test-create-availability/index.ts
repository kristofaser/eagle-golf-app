import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    console.log('🚀 Test function called');

    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      console.log('❌ No auth header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const requestBody = await req.json();
    console.log('📥 Request body:', requestBody);

    // Just return success for testing
    return new Response(
      JSON.stringify({
        success: true,
        availability_id: 'test-id-12345',
        created: true,
        debug: 'Test function working',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
