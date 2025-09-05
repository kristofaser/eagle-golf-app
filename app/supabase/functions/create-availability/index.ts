import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create a Supabase client with the user's JWT for authentication
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create a separate client with service role for admin operations
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const requestBody = await req.json();
    const { pro_id, golf_course_id, date, start_time } = requestBody;

    console.log('🔍 Request data:', { pro_id, golf_course_id, date, start_time, user: user.id });

    // Validation
    if (!pro_id || !golf_course_id || !date || !start_time) {
      console.error('❌ Missing fields:', { pro_id, golf_course_id, date, start_time });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: pro_id, golf_course_id, date, start_time',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Calculate end time (2 hours later)
    const calculateEndTime = (startTime: string): string => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHour = hours + 2;
      return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    console.log('🔍 Searching for existing availability...');
    // First try to find existing availability
    const { data: existingAvailability, error: searchError } = await adminSupabase
      .from('pro_availabilities')
      .select('id')
      .eq('pro_id', pro_id)
      .eq('golf_course_id', golf_course_id)
      .eq('date', date)
      .eq('start_time', start_time)
      .single();

    console.log('🔍 Search result:', { existingAvailability, searchError });

    if (existingAvailability && !searchError) {
      console.log('✅ Found existing availability:', existingAvailability.id);
      return new Response(
        JSON.stringify({
          success: true,
          availability_id: existingAvailability.id,
          created: false,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create new availability if not found
    console.log('📝 Creating new availability...');
    const endTime = calculateEndTime(start_time);
    const { data: newAvailability, error: createError } = await adminSupabase
      .from('pro_availabilities')
      .insert({
        pro_id,
        golf_course_id,
        date,
        start_time,
        end_time: endTime,
        max_players: 4,
        current_bookings: 0,
      })
      .select('id')
      .single();

    console.log('📝 Create result:', { newAvailability, createError });

    if (createError) {
      console.error('❌ Error creating availability:', createError);
      return new Response(
        JSON.stringify({
          error: `Failed to create availability: ${createError.message}`,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('✅ Created new availability:', newAvailability.id);

    return new Response(
      JSON.stringify({
        success: true,
        availability_id: newAvailability.id,
        created: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
