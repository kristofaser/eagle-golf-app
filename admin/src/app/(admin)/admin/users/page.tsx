import { createServiceClient, createClient } from '@/lib/supabase/server';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  // Utiliser le service client pour contourner les RLS
  const supabase = await createServiceClient();
  
  // Récupérer l'utilisateur actuellement connecté avec ses permissions
  const sessionClient = await createClient();
  const { data: { user: currentUser } } = await sessionClient.auth.getUser();
  
  // Récupérer le profil admin de l'utilisateur connecté
  const { data: currentUserProfile } = await supabase
    .from('admin_profiles')
    .select('role, permissions')
    .eq('id', currentUser?.id)
    .single();
  
  // Récupérer les administrateurs depuis la nouvelle table admin_profiles
  const { data: adminUsers, error: adminUsersError } = await supabase
    .from('admin_profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      permissions,
      is_active,
      created_at,
      last_login
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (adminUsersError) {
    console.error('Erreur lors de la récupération des utilisateurs admin:', adminUsersError);
  }

  // Formater les données pour l'affichage
  const users = adminUsers?.map((admin) => {
    return {
      id: admin.id,
      name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Sans nom',
      email: admin.email || '',
      phone: admin.phone,
      city: null, // Plus de champ city dans admin_profiles
      createdAt: admin.created_at,
      avatarUrl: null, // Plus d'avatar pour les admins
      role: admin.role,
      permissions: admin.permissions,
      isSuperAdmin: admin.role === 'super_admin',
      lastLogin: admin.last_login
    };
  }) || [];

  return (
    <AdminUsersClient 
      initialUsers={users} 
      currentUserId={currentUser?.id || ''} 
      currentUserRole={currentUserProfile?.role || 'admin'}
      currentUserPermissions={currentUserProfile?.permissions || []}
    />
  );
}