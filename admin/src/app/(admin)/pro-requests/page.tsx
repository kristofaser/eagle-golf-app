import { createServiceClient, createClient } from '@/lib/supabase/server';
import ProRequestsClient from './ProRequestsClient';
import type { ProValidationRequestWithDetails } from '@/types';

export default async function ProRequestsPage() {
  // Utiliser le service client pour contourner les RLS
  const supabase = await createServiceClient();
  
  // Récupérer l'utilisateur actuellement connecté avec ses permissions
  const sessionClient = await createClient();
  const { data: { user: currentUser } } = await sessionClient.auth.getUser();
  
  // Récupérer le profil admin de l'utilisateur connecté
  const { data: currentUserProfile } = await supabase
    .from('admin_profiles')
    .select('role, permissions')
    .eq('email', currentUser?.email)
    .single();
  
  // Vérifier si l'utilisateur peut valider les demandes pro
  const canValidate = currentUserProfile?.permissions?.includes('validate_pro_requests') || 
                     currentUserProfile?.permissions?.includes('manage_users') || 
                     currentUserProfile?.role === 'super_admin';
  
  // Récupérer les demandes de validation pro avec les détails
  const { data: proRequestsData, error: requestsError } = await supabase
    .from('pro_validation_requests')
    .select(`
      *,
      user_profile:profiles!user_id (
        first_name,
        last_name,
        email,
        city,
        avatar_url
      ),
      admin_profile:admin_profiles!admin_id (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (requestsError) {
    console.error('Erreur lors de la récupération des demandes pro:', requestsError);
  }

  // Formater les données pour l'affichage
  const proRequests: ProValidationRequestWithDetails[] = proRequestsData?.map(request => ({
    ...request,
    user_profile: {
      first_name: request.user_profile?.first_name || '',
      last_name: request.user_profile?.last_name || '',
      email: request.user_profile?.email || '',
      city: request.user_profile?.city || null,
      avatar_url: request.user_profile?.avatar_url || null,
    },
    admin_profile: request.admin_profile ? {
      first_name: request.admin_profile.first_name || '',
      last_name: request.admin_profile.last_name || '',
      email: request.admin_profile.email || '',
    } : undefined,
  })) || [];

  return (
    <ProRequestsClient 
      initialRequests={proRequests}
      canValidate={canValidate}
    />
  );
}