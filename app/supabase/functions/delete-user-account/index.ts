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

      // 2. Delete payments and payment logs
      const { error: paymentsError } = await supabaseAdmin
        .from('payments')
        .delete()
        .eq('user_id', userId);

      if (paymentsError) {
        console.error('Error deleting payments:', paymentsError);
      }

      const { error: paymentLogsError } = await supabaseAdmin
        .from('payment_logs')
        .delete()
        .eq('user_id', userId);

      if (paymentLogsError) {
        console.error('Error deleting payment logs:', paymentLogsError);
      }

      // 3. Delete reviews (as reviewer and as reviewee)
      const { error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .delete()
        .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);

      if (reviewsError) {
        console.error('Error deleting reviews:', reviewsError);
      }

      // 4. Delete all notification-related data
      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (notificationsError) {
        console.error('Error deleting notifications:', notificationsError);
      }

      const { error: deviceTokensError } = await supabaseAdmin
        .from('device_tokens')
        .delete()
        .eq('user_id', userId);

      if (deviceTokensError) {
        console.error('Error deleting device tokens:', deviceTokensError);
      }

      const { error: pushTokensError } = await supabaseAdmin
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      if (pushTokensError) {
        console.error('Error deleting push tokens:', pushTokensError);
      }

      // 5. Delete travel-related data
      const { error: tripsError } = await supabaseAdmin
        .from('trips')
        .delete()
        .eq('user_id', userId);

      if (tripsError) {
        console.error('Error deleting trips:', tripsError);
      }

      const { error: travelPrefsError } = await supabaseAdmin
        .from('travel_notification_preferences')
        .delete()
        .eq('user_id', userId);

      if (travelPrefsError) {
        console.error('Error deleting travel notification preferences:', travelPrefsError);
      }

      const { error: userCourseAlertsError } = await supabaseAdmin
        .from('user_course_alerts')
        .delete()
        .eq('user_id', userId);

      if (userCourseAlertsError) {
        console.error('Error deleting user course alerts:', userCourseAlertsError);
      }

      const { error: userTravelAlertsError } = await supabaseAdmin
        .from('user_travel_alerts')
        .delete()
        .eq('user_id', userId);

      if (userTravelAlertsError) {
        console.error('Error deleting user travel alerts:', userTravelAlertsError);
      }

      // 6. Delete pro-specific data (for pros)
      const { error: proAvailabilitiesError } = await supabaseAdmin
        .from('pro_availabilities')
        .delete()
        .eq('pro_id', userId);

      if (proAvailabilitiesError) {
        console.error('Error deleting pro availabilities:', proAvailabilitiesError);
      }

      const { error: proAvailabilitySettingsError } = await supabaseAdmin
        .from('pro_availability_settings')
        .delete()
        .eq('pro_id', userId);

      if (proAvailabilitySettingsError) {
        console.error('Error deleting pro availability settings:', proAvailabilitySettingsError);
      }

      const { error: proDailyAvailabilitiesError } = await supabaseAdmin
        .from('pro_daily_availabilities')
        .delete()
        .eq('pro_id', userId);

      if (proDailyAvailabilitiesError) {
        console.error('Error deleting pro daily availabilities:', proDailyAvailabilitiesError);
      }

      const { error: proGolfAffiliationsError } = await supabaseAdmin
        .from('pro_golf_affiliations')
        .delete()
        .eq('pro_id', userId);

      if (proGolfAffiliationsError) {
        console.error('Error deleting pro golf affiliations:', proGolfAffiliationsError);
      }

      const { error: proMembershipsError } = await supabaseAdmin
        .from('pro_memberships')
        .delete()
        .eq('pro_id', userId);

      if (proMembershipsError) {
        console.error('Error deleting pro memberships:', proMembershipsError);
      }

      const { error: proPricingError } = await supabaseAdmin
        .from('pro_pricing')
        .delete()
        .eq('pro_id', userId);

      if (proPricingError) {
        console.error('Error deleting pro pricing:', proPricingError);
      }

      const { error: proUnavailabilitiesError } = await supabaseAdmin
        .from('pro_unavailabilities')
        .delete()
        .eq('pro_id', userId);

      if (proUnavailabilitiesError) {
        console.error('Error deleting pro unavailabilities:', proUnavailabilitiesError);
      }

      // 7. Delete old availabilities table (for backward compatibility)
      const { error: availabilitiesError } = await supabaseAdmin
        .from('availabilities')
        .delete()
        .eq('pro_id', userId);

      if (availabilitiesError) {
        console.error('Error deleting availabilities:', availabilitiesError);
      }

      // 8. Delete user roles
      const { error: userRolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (userRolesError) {
        console.error('Error deleting user roles:', userRolesError);
      }

      // 9. Delete pro validation requests
      const { error: proRequestsError } = await supabaseAdmin
        .from('pro_validation_requests')
        .delete()
        .eq('user_id', userId);

      if (proRequestsError) {
        console.error('Error deleting pro validation requests:', proRequestsError);
      }

      // 10. Delete amateur profile if exists
      const { error: amateurError } = await supabaseAdmin
        .from('amateur_profiles')
        .delete()
        .eq('user_id', userId);

      if (amateurError) {
        console.error('Error deleting amateur profile:', amateurError);
      }

      // 11. Delete pro profile if exists
      const { error: proError } = await supabaseAdmin
        .from('pro_profiles')
        .delete()
        .eq('user_id', userId);

      if (proError) {
        console.error('Error deleting pro profile:', proError);
      }

      // 12. Delete main profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // 13. Delete user from storage (profile pictures, etc.)
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

      // 14. Finally, delete the user from auth.users using admin API
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
