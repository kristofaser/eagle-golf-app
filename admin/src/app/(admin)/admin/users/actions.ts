'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import { AdminFormData } from '@/components/admin/AddAdminModal';
import { EditAdminFormData } from '@/components/admin/EditAdminModal';

export async function createAdminUser(data: AdminFormData) {
  try {
    const supabase = await createServiceClient();
    
    // Vérifier les permissions de l'utilisateur connecté
    const sessionClient = await createClient();
    const { data: { user: currentUser } } = await sessionClient.auth.getUser();
    
    if (!currentUser) {
      return { success: false, message: 'Non authentifié' };
    }
    
    const { data: currentUserProfile } = await supabase
      .from('admin_profiles')
      .select('role, permissions')
      .eq('id', currentUser.id)
      .single();
    
    const canManageAdmins = currentUserProfile?.permissions?.includes('manage_admin_users') || 
                           currentUserProfile?.role === 'super_admin';
    
    if (!canManageAdmins) {
      return { success: false, message: 'Permissions insuffisantes' };
    }

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      }
    });

    if (authError || !authUser.user) {
      throw new Error(`Erreur création utilisateur: ${authError?.message}`);
    }

    // 2. Créer le profil admin
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .insert({
        id: authUser.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
        is_active: true,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      // Nettoyer l'utilisateur auth en cas d'échec
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Erreur création profil: ${profileError.message}`);
    }

    // Revalider la page pour refléter les changements
    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Administrateur créé avec succès',
      user: authUser.user,
    };

  } catch (error) {
    console.error('Erreur createAdminUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création',
    };
  }
}

export async function updateAdminUser(userId: string, data: EditAdminFormData) {
  try {
    console.log('🔄 Mise à jour admin:', { userId, data });
    const supabase = await createServiceClient();
    
    // Vérifier les permissions de l'utilisateur connecté
    const sessionClient = await createClient();
    const { data: { user: currentUser } } = await sessionClient.auth.getUser();
    
    if (!currentUser) {
      return { success: false, message: 'Non authentifié' };
    }
    
    // Pour la modification, permettre aussi de modifier son propre profil
    if (currentUser.id !== userId) {
      const { data: currentUserProfile } = await supabase
        .from('admin_profiles')
        .select('role, permissions')
        .eq('id', currentUser.id)
        .single();
      
      const canManageAdmins = currentUserProfile?.permissions?.includes('manage_admin_users') || 
                             currentUserProfile?.role === 'super_admin';
      
      if (!canManageAdmins) {
        return { success: false, message: 'Permissions insuffisantes' };
      }
    }

    // 1. Mettre à jour l'utilisateur dans Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      email: data.email,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      }
    });

    if (authError) {
      console.error('❌ Erreur Auth update:', authError);
      throw new Error(`Erreur mise à jour utilisateur: ${authError.message}`);
    }

    console.log('✅ Auth user updated');

    // 2. Mettre à jour le profil admin
    const { data: updateResult, error: profileError } = await supabase
      .from('admin_profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        permissions: data.permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('❌ Erreur Profile update:', profileError);
      throw new Error(`Erreur mise à jour profil: ${profileError.message}`);
    }

    console.log('✅ Profile updated:', updateResult);

    // Forcer la revalidation avec plusieurs paths
    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Administrateur mis à jour avec succès',
    };

  } catch (error) {
    console.error('Erreur updateAdminUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    };
  }
}

export async function deleteAdminUser(userId: string) {
  try {
    const supabase = await createServiceClient();
    
    // Vérifier les permissions de l'utilisateur connecté
    const sessionClient = await createClient();
    const { data: { user: currentUser } } = await sessionClient.auth.getUser();
    
    if (!currentUser) {
      return { success: false, message: 'Non authentifié' };
    }
    
    // Empêcher la suppression de son propre compte
    if (currentUser.id === userId) {
      return { success: false, message: 'Impossible de supprimer son propre compte' };
    }
    
    const { data: currentUserProfile } = await supabase
      .from('admin_profiles')
      .select('role, permissions')
      .eq('id', currentUser.id)
      .single();
    
    const canManageAdmins = currentUserProfile?.permissions?.includes('manage_admin_users') || 
                           currentUserProfile?.role === 'super_admin';
    
    if (!canManageAdmins) {
      return { success: false, message: 'Permissions insuffisantes' };
    }

    // 1. Supprimer le profil admin
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Erreur suppression profil: ${profileError.message}`);
    }

    // 2. Supprimer l'utilisateur de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Erreur suppression utilisateur: ${authError.message}`);
    }

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Administrateur supprimé avec succès',
    };

  } catch (error) {
    console.error('Erreur deleteAdminUser:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la suppression',
    };
  }
}

export async function toggleAdminUserStatus(userId: string, isActive: boolean) {
  try {
    const supabase = await createServiceClient();
    
    // Vérifier les permissions de l'utilisateur connecté
    const sessionClient = await createClient();
    const { data: { user: currentUser } } = await sessionClient.auth.getUser();
    
    if (!currentUser) {
      return { success: false, message: 'Non authentifié' };
    }
    
    // Empêcher la modification de son propre statut
    if (currentUser.id === userId) {
      return { success: false, message: 'Impossible de modifier son propre statut' };
    }
    
    const { data: currentUserProfile } = await supabase
      .from('admin_profiles')
      .select('role, permissions')
      .eq('id', currentUser.id)
      .single();
    
    const canManageAdmins = currentUserProfile?.permissions?.includes('manage_admin_users') || 
                           currentUserProfile?.role === 'super_admin';
    
    if (!canManageAdmins) {
      return { success: false, message: 'Permissions insuffisantes' };
    }

    // Mettre à jour le statut dans admin_profiles
    const { error: profileError } = await supabase
      .from('admin_profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Erreur changement statut: ${profileError.message}`);
    }

    // Si désactivation, on peut aussi bloquer l'utilisateur dans Supabase Auth
    if (!isActive) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { disabled: true }
      });
    } else {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { disabled: false }
      });
    }

    revalidatePath('/admin/users');

    return {
      success: true,
      message: `Administrateur ${isActive ? 'réactivé' : 'désactivé'} avec succès`,
    };

  } catch (error) {
    console.error('Erreur toggleAdminUserStatus:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors du changement de statut',
    };
  }
}

export async function resetAdminPassword(userId: string, email: string) {
  try {
    const supabase = await createServiceClient();
    
    // Vérifier les permissions de l'utilisateur connecté
    const sessionClient = await createClient();
    const { data: { user: currentUser } } = await sessionClient.auth.getUser();
    
    if (!currentUser) {
      return { success: false, message: 'Non authentifié' };
    }
    
    // Pour la réinitialisation de mot de passe, permettre de le faire pour soi-même
    if (currentUser.id !== userId) {
      const { data: currentUserProfile } = await supabase
        .from('admin_profiles')
        .select('role, permissions')
        .eq('id', currentUser.id)
        .single();
      
      const canManageAdmins = currentUserProfile?.permissions?.includes('manage_admin_users') || 
                             currentUserProfile?.role === 'super_admin';
      
      if (!canManageAdmins) {
        return { success: false, message: 'Permissions insuffisantes' };
      }
    }

    // Générer un nouveau mot de passe temporaire
    const tempPassword = generateTempPassword();

    // Mettre à jour le mot de passe
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword
    });

    if (authError) {
      throw new Error(`Erreur réinitialisation mot de passe: ${authError.message}`);
    }

    // En production, vous devriez envoyer le mot de passe par email
    // Pour le développement, on le retourne dans la réponse
    console.log(`Nouveau mot de passe temporaire pour ${email}: ${tempPassword}`);

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      tempPassword, // À retirer en production
    };

  } catch (error) {
    console.error('Erreur resetAdminPassword:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation',
    };
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}