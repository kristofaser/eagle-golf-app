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
    .from('profiles')
    .select('user_type, admin_permissions')
    .eq('id', currentUser?.id)
    .eq('is_admin', true)
    .single();

  // Récupérer les administrateurs depuis profiles
  const { data: adminUsers, error: adminUsersError } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      user_type,
      admin_permissions,
      admin_created_at,
      admin_last_login
    `)
    .eq('is_admin', true)
    .order('admin_created_at', { ascending: false });

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
      city: null,
      createdAt: admin.admin_created_at,
      avatarUrl: null,
      role: admin.user_type,
      permissions: admin.admin_permissions,
      isSuperAdmin: admin.user_type === 'super_admin',
      lastLogin: admin.admin_last_login
    };
  }) || [];

  return (
    <AdminUsersClient
      initialUsers={users}
      currentUserId={currentUser?.id || ''}
      currentUserRole={currentUserProfile?.user_type || 'admin'}
      currentUserPermissions={currentUserProfile?.admin_permissions || []}
    />
  );
}