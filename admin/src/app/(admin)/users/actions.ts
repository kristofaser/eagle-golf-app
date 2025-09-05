'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';

// Fonction utilitaire pour vérifier les permissions
async function checkUserPermissions() {
  const sessionClient = await createClient();
  const { data: { user: currentUser } } = await sessionClient.auth.getUser();
  
  if (!currentUser) {
    return { 
      success: false, 
      message: 'Non authentifié',
      currentUser: null,
      canManage: false 
    };
  }
  
  const supabase = await createServiceClient();
  const { data: currentUserProfile } = await supabase
    .from('admin_profiles')
    .select('role, permissions')
    .eq('id', currentUser.id)
    .single();
  
  const canManageUsers = currentUserProfile?.permissions?.includes('manage_users') || 
                        currentUserProfile?.permissions?.includes('manage_admin_users') || 
                        currentUserProfile?.role === 'super_admin';
  
  return {
    success: true,
    currentUser,
    currentUserProfile,
    canManage: canManageUsers
  };
}

/**
 * Suspendre un utilisateur de l'application mobile
 */
export async function suspendUser(userId: string, reason: string = '') {
  try {
    console.log('🚫 Suspension utilisateur:', { userId, reason });
    
    // Vérifier les permissions
    const permissionCheck = await checkUserPermissions();
    if (!permissionCheck.success || !permissionCheck.canManage) {
      return { 
        success: false, 
        message: permissionCheck.message || 'Permissions insuffisantes' 
      };
    }
    
    const supabase = await createServiceClient();
    
    // Vérifier que l'utilisateur existe
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, is_suspended')
      .eq('id', userId)
      .single();
    
    if (userError || !userExists) {
      return { 
        success: false, 
        message: 'Utilisateur non trouvé' 
      };
    }
    
    if (userExists.is_suspended) {
      return { 
        success: false, 
        message: 'L\'utilisateur est déjà suspendu' 
      };
    }
    
    // Suspendre l'utilisateur dans la base de données
    const { error: suspendError } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_by: permissionCheck.currentUser!.id,
        suspension_reason: reason || 'Suspension par administrateur'
      })
      .eq('id', userId);
    
    if (suspendError) {
      throw new Error(`Erreur lors de la suspension: ${suspendError.message}`);
    }
    
    // Désactiver l'utilisateur dans Supabase Auth (optionnel - empêche la connexion)
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { suspended: true },
      app_metadata: { suspended: true, suspended_at: new Date().toISOString() }
    });
    
    if (authError) {
      console.warn('Erreur Auth lors de la suspension:', authError.message);
      // Ne pas faire échouer la suspension si l'Auth échoue
    }
    
    // Revalider les pages
    revalidatePath('/users');
    
    console.log('✅ Utilisateur suspendu avec succès');
    return {
      success: true,
      message: `Utilisateur ${userExists.first_name} ${userExists.last_name} suspendu avec succès`,
    };
    
  } catch (error) {
    console.error('❌ Erreur suspendUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la suspension',
    };
  }
}

/**
 * Réactiver un utilisateur suspendu
 */
export async function unsuspendUser(userId: string) {
  try {
    console.log('✅ Réactivation utilisateur:', userId);
    
    // Vérifier les permissions
    const permissionCheck = await checkUserPermissions();
    if (!permissionCheck.success || !permissionCheck.canManage) {
      return { 
        success: false, 
        message: permissionCheck.message || 'Permissions insuffisantes' 
      };
    }
    
    const supabase = await createServiceClient();
    
    // Vérifier que l'utilisateur existe et est suspendu
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, is_suspended')
      .eq('id', userId)
      .single();
    
    if (userError || !userExists) {
      return { 
        success: false, 
        message: 'Utilisateur non trouvé' 
      };
    }
    
    if (!userExists.is_suspended) {
      return { 
        success: false, 
        message: 'L\'utilisateur n\'est pas suspendu' 
      };
    }
    
    // Réactiver l'utilisateur dans la base de données
    const { error: unsuspendError } = await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null
      })
      .eq('id', userId);
    
    if (unsuspendError) {
      throw new Error(`Erreur lors de la réactivation: ${unsuspendError.message}`);
    }
    
    // Réactiver l'utilisateur dans Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { suspended: false },
      app_metadata: { suspended: false, suspended_at: null }
    });
    
    if (authError) {
      console.warn('Erreur Auth lors de la réactivation:', authError.message);
    }
    
    // Revalider les pages
    revalidatePath('/users');
    
    console.log('✅ Utilisateur réactivé avec succès');
    return {
      success: true,
      message: `Utilisateur ${userExists.first_name} ${userExists.last_name} réactivé avec succès`,
    };
    
  } catch (error) {
    console.error('❌ Erreur unsuspendUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la réactivation',
    };
  }
}

/**
 * Supprimer définitivement un utilisateur
 */
export async function deleteUser(userId: string) {
  try {
    console.log('🗑️ Suppression utilisateur:', userId);
    
    // Vérifier les permissions
    const permissionCheck = await checkUserPermissions();
    if (!permissionCheck.success || !permissionCheck.canManage) {
      return { 
        success: false, 
        message: permissionCheck.message || 'Permissions insuffisantes' 
      };
    }
    
    const supabase = await createServiceClient();
    
    // Vérifier que l'utilisateur existe
    const { data: userExists, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, user_type')
      .eq('id', userId)
      .single();
    
    if (userError || !userExists) {
      return { 
        success: false, 
        message: 'Utilisateur non trouvé' 
      };
    }
    
    // Vérifier s'il y a des réservations actives
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('id')
      .or(`amateur_id.eq.${userId},pro_id.eq.${userId}`)
      .in('status', ['pending', 'confirmed'])
      .limit(1);
    
    if (activeBookings && activeBookings.length > 0) {
      return {
        success: false,
        message: 'Impossible de supprimer un utilisateur avec des réservations actives',
      };
    }
    
    // 1. Supprimer TOUS les profils spécialisés (contraintes FK)
    // Un utilisateur peut avoir les deux profils pendant les transitions
    
    // Supprimer profil amateur si existe
    const { error: amateurError } = await supabase
      .from('amateur_profiles')
      .delete()
      .eq('user_id', userId);
    
    if (amateurError) {
      console.warn('Erreur suppression profil amateur:', amateurError.message);
    }
    
    // Supprimer profil pro si existe
    const { error: proError } = await supabase
      .from('pro_profiles')
      .delete()
      .eq('user_id', userId);
    
    if (proError) {
      console.warn('Erreur suppression profil pro:', proError.message);
    }
    
    // 2. Supprimer les réservations passées/annulées (garder historique dans logs si nécessaire)
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .or(`amateur_id.eq.${userId},pro_id.eq.${userId}`);
    
    if (bookingsError) {
      console.warn('Erreur suppression réservations:', bookingsError.message);
    }
    
    // 3. Supprimer le profil principal
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      throw new Error(`Erreur suppression profil: ${profileError.message}`);
    }
    
    // 4. Supprimer l'utilisateur de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.warn('Erreur suppression Auth:', authError.message);
      // Ne pas faire échouer si Auth échoue (profil déjà supprimé)
    }
    
    // Revalider les pages
    revalidatePath('/users');
    
    console.log('✅ Utilisateur supprimé avec succès');
    return {
      success: true,
      message: `Utilisateur ${userExists.first_name} ${userExists.last_name} supprimé définitivement`,
    };
    
  } catch (error) {
    console.error('❌ Erreur deleteUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}