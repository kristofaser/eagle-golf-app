import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the user making the request
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete user data in order (most dependent tables first)
    const userId = user.id;
    console.log(`Starting deletion process for user ${userId}`);

    try {
      // 1. Delete bookings (as amateur and as pro)
      const { error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .or(`amateur_id.eq.${userId},pro_id.eq.${userId}`);

      if (bookingsError) {
        console.error('Error deleting bookings:', bookingsError);
      }

      // 2. Delete reviews (as reviewer and as reviewee)
      const { error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .delete()
        .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);

      if (reviewsError) {
        console.error('Error deleting reviews:', reviewsError);
      }

      // 3. Delete availabilities (for pros)
      const { error: availabilitiesError } = await supabaseAdmin
        .from('availabilities')
        .delete()
        .eq('pro_id', userId);

      if (availabilitiesError) {
        console.error('Error deleting availabilities:', availabilitiesError);
      }

      // 4. Delete pro validation requests if exists
      const { error: proRequestsError } = await supabaseAdmin
        .from('pro_validation_requests')
        .delete()
        .eq('user_id', userId);

      if (proRequestsError) {
        console.error('Error deleting pro validation requests:', proRequestsError);
      }

      // 5. Delete amateur profile if exists
      const { error: amateurError } = await supabaseAdmin
        .from('amateur_profiles')
        .delete()
        .eq('user_id', userId);

      if (amateurError) {
        console.error('Error deleting amateur profile:', amateurError);
      }

      // 6. Delete pro profile if exists
      const { error: proError } = await supabaseAdmin
        .from('pro_profiles')
        .delete()
        .eq('user_id', userId);

      if (proError) {
        console.error('Error deleting pro profile:', proError);
      }

      // 7. Delete main profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // 8. Delete user from storage (profile pictures, etc.)
      // List all files in user's folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId);

      if (!listError && files && files.length > 0) {
        // Delete all files
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        const { error: deleteStorageError } = await supabaseAdmin.storage
          .from('avatars')
          .remove(filePaths);

        if (deleteStorageError) {
          console.error('Error deleting storage files:', deleteStorageError);
        }
      }

      // 9. Finally, delete the user from auth.users using admin API
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting user from auth:', deleteError);
        return new Response(
          JSON.stringify({
            error: 'Failed to delete user account from auth',
            details: deleteError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`Successfully deleted user ${userId}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User account and all related data deleted successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (deleteError: any) {
      console.error('Error during deletion process:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'Failed to delete some user data',
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in delete-user-account function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
