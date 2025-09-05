'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import type { ProValidationRequestWithDetails, ProRequestFilters } from '@/types';

// Fonction utilitaire pour vérifier les permissions
async function checkProValidationPermissions() {
  const sessionClient = await createClient();
  const { data: { user: currentUser } } = await sessionClient.auth.getUser();
  
  if (!currentUser) {
    return { 
      success: false, 
      message: 'Non authentifié',
      currentUser: null,
      canValidate: false 
    };
  }
  
  const supabase = await createServiceClient();
  const { data: currentUserProfile } = await supabase
    .from('admin_profiles')
    .select('role, permissions')
    .eq('email', currentUser.email)
    .single();
  
  const canValidatePro = currentUserProfile?.permissions?.includes('validate_pro_requests') || 
                        currentUserProfile?.permissions?.includes('manage_users') || 
                        currentUserProfile?.role === 'super_admin';
  
  return {
    success: true,
    currentUser,
    currentUserProfile,
    canValidate: canValidatePro
  };
}

/**
 * Récupérer la liste des demandes de validation pro avec filtres
 */
export async function getProRequests(filters: ProRequestFilters = { status: 'all' }) {
  try {
    console.log('📋 Récupération demandes pro avec filtres:', filters);
    
    // Vérifier les permissions
    const permissionCheck = await checkProValidationPermissions();
    if (!permissionCheck.success || !permissionCheck.canValidate) {
      throw new Error(permissionCheck.message || 'Permissions insuffisantes');
    }
    
    const supabase = await createServiceClient();
    
    let query = supabase
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

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Filtre par recherche (nom, email)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      // Note: Ici on devrait idéalement faire une recherche full-text ou utiliser un index
      // Pour l'instant, on fait une recherche simple par email/prénom/nom
      query = query.or(`user_profile.first_name.ilike.%${searchTerm}%,user_profile.last_name.ilike.%${searchTerm}%,user_profile.email.ilike.%${searchTerm}%`);
    }

    // Filtre par date
    if (filters.dateRange?.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange?.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data: requests, error } = await query;
    
    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
    
    console.log(`✅ ${requests?.length || 0} demandes pro récupérées`);
    
    return {
      success: true,
      data: requests as ProValidationRequestWithDetails[],
      count: requests?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Erreur getProRequests:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération des demandes',
      data: [],
      count: 0
    };
  }
}

/**
 * Récupérer une demande de validation pro spécifique
 */
export async function getProRequest(requestId: string) {
  try {
    console.log('📋 Récupération demande pro:', requestId);
    
    // Vérifier les permissions
    const permissionCheck = await checkProValidationPermissions();
    if (!permissionCheck.success || !permissionCheck.canValidate) {
      throw new Error(permissionCheck.message || 'Permissions insuffisantes');
    }
    
    const supabase = await createServiceClient();
    
    const { data: request, error } = await supabase
      .from('pro_validation_requests')
      .select(`
        *,
        user_profile:profiles!user_id (
          first_name,
          last_name,
          email,
          city,
          avatar_url,
          phone
        ),
        admin_profile:admin_profiles!admin_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', requestId)
      .single();
    
    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
    
    if (!request) {
      throw new Error('Demande introuvable');
    }
    
    console.log('✅ Demande pro récupérée:', request.id);
    
    return {
      success: true,
      data: request as ProValidationRequestWithDetails
    };
    
  } catch (error) {
    console.error('❌ Erreur getProRequest:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération de la demande',
      data: null
    };
  }
}

/**
 * Approuver une demande de validation pro
 */
export async function approveProRequest(requestId: string, adminNotes: string = '') {
  try {
    console.log('✅ Approbation demande pro:', { requestId, adminNotes });
    
    // Vérifier les permissions
    const permissionCheck = await checkProValidationPermissions();
    if (!permissionCheck.success || !permissionCheck.canValidate) {
      return { 
        success: false, 
        message: permissionCheck.message || 'Permissions insuffisantes' 
      };
    }
    
    const supabase = await createServiceClient();
    
    // Récupérer la demande de validation
    const { data: proRequest, error: requestError } = await supabase
      .from('pro_validation_requests')
      .select(`
        *,
        user_profile:profiles!user_id (
          id,
          first_name,
          last_name,
          email,
          user_type
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      throw new Error(`Erreur lors de la récupération de la demande: ${requestError.message}`);
    }
    
    if (!proRequest) {
      throw new Error('Demande introuvable');
    }
    
    if (proRequest.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Récupérer le profil admin
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, first_name, last_name, email')
      .eq('email', permissionCheck.currentUser?.email)
      .single();

    if (!adminProfile) {
      throw new Error('Profil admin introuvable');
    }

    // Utiliser la fonction PostgreSQL pour valider la demande
    console.log('💾 Appel fonction validate_pro_request...', { 
      requestId, 
      adminId: adminProfile.id, 
      action: 'approve' 
    });
    
    const { error: validateError } = await supabase.rpc('validate_pro_request', {
      p_request_id: requestId,
      p_admin_id: adminProfile.id,
      p_action: 'approve',
      p_admin_notes: adminNotes || null
    });

    if (validateError) {
      console.error('❌ Erreur fonction validate_pro_request:', validateError);
      throw new Error(`Erreur lors de la validation: ${validateError.message}`);
    }

    console.log('✅ Validation réussie via fonction PostgreSQL');
    
    // Revalider les pages
    revalidatePath('/pro-requests');
    revalidatePath('/dashboard');
    revalidatePath('/users');
    
    const userFullName = `${proRequest.user_profile?.first_name || ''} ${proRequest.user_profile?.last_name || ''}`.trim();
    const successMessage = `Demande de ${userFullName} approuvée avec succès. L'utilisateur est maintenant professionnel.`;
    
    console.log('✅ Demande pro approuvée avec succès');
    return {
      success: true,
      message: successMessage,
    };
    
  } catch (error) {
    console.error('❌ Erreur approveProRequest:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'approbation',
    };
  }
}

/**
 * Rejeter une demande de validation pro
 */
export async function rejectProRequest(requestId: string, adminNotes: string = '') {
  try {
    console.log('❌ Rejet demande pro:', { requestId, adminNotes });
    
    // Vérifier les permissions
    const permissionCheck = await checkProValidationPermissions();
    if (!permissionCheck.success || !permissionCheck.canValidate) {
      return { 
        success: false, 
        message: permissionCheck.message || 'Permissions insuffisantes' 
      };
    }
    
    const supabase = await createServiceClient();
    
    // Récupérer la demande de validation
    const { data: proRequest, error: requestError } = await supabase
      .from('pro_validation_requests')
      .select(`
        *,
        user_profile:profiles!user_id (
          id,
          first_name,
          last_name,
          email,
          user_type
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      throw new Error(`Erreur lors de la récupération de la demande: ${requestError.message}`);
    }
    
    if (!proRequest) {
      throw new Error('Demande introuvable');
    }
    
    if (proRequest.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Récupérer le profil admin
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, first_name, last_name, email')
      .eq('email', permissionCheck.currentUser?.email)
      .single();

    if (!adminProfile) {
      throw new Error('Profil admin introuvable');
    }

    // Utiliser la fonction PostgreSQL pour valider la demande
    console.log('💾 Appel fonction validate_pro_request...', { 
      requestId, 
      adminId: adminProfile.id, 
      action: 'reject' 
    });
    
    const { error: validateError } = await supabase.rpc('validate_pro_request', {
      p_request_id: requestId,
      p_admin_id: adminProfile.id,
      p_action: 'reject',
      p_admin_notes: adminNotes || null
    });

    if (validateError) {
      console.error('❌ Erreur fonction validate_pro_request:', validateError);
      throw new Error(`Erreur lors de la validation: ${validateError.message}`);
    }

    console.log('✅ Validation réussie via fonction PostgreSQL');
    
    // Revalider les pages
    revalidatePath('/pro-requests');
    revalidatePath('/dashboard');
    
    const userFullName = `${proRequest.user_profile?.first_name || ''} ${proRequest.user_profile?.last_name || ''}`.trim();
    const successMessage = `Demande de ${userFullName} rejetée.`;
    
    console.log('✅ Demande pro rejetée avec succès');
    return {
      success: true,
      message: successMessage,
    };
    
  } catch (error) {
    console.error('❌ Erreur rejectProRequest:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors du rejet',
    };
  }
}

/**
 * Récupérer les statistiques des demandes pro pour le dashboard
 */
export async function getProRequestsStats() {
  try {
    const supabase = await createServiceClient();
    
    // Compter les demandes par statut
    const { data: stats, error } = await supabase
      .from('pro_validation_requests')
      .select('status')
      .then(result => {
        if (result.error) throw result.error;
        
        const counts = {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: result.data.length
        };
        
        result.data.forEach(request => {
          counts[request.status as keyof typeof counts]++;
        });
        
        return { data: counts, error: null };
      });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    console.error('❌ Erreur getProRequestsStats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques',
      data: { pending: 0, approved: 0, rejected: 0, total: 0 }
    };
  }
}