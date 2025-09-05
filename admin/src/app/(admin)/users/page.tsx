import { createServiceClient, createClient } from '@/lib/supabase/server';
import UsersClient from './UsersClient';

export default async function UsersPage() {
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
  
  // Récupérer les données des utilisateurs
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Récupérer les rôles séparément
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      roles(name)
    `);

  if (usersError) {
    console.error('Erreur lors de la récupération des utilisateurs:', usersError);
  }

  // Récupérer les infos des admins qui ont suspendu (si nécessaire)
  const suspendedByIds = usersData?.filter(u => u.suspended_by).map(u => u.suspended_by) || [];
  let suspendedByData: any[] = [];
  
  if (suspendedByIds.length > 0) {
    const { data: adminData } = await supabase
      .from('admin_profiles')
      .select('id, first_name, last_name')
      .in('id', suspendedByIds);
    
    suspendedByData = adminData || [];
  }

  // Formater les données pour l'affichage (exclure les admins et super_admins)
  const users = usersData?.map(user => {
    const hasAdminRole = userRoles?.some(
      (ur: any) => ur.user_id === user.id && (ur.roles?.name === 'admin' || ur.roles?.name === 'super_admin')
    ) || false;
    
    // Trouver l'admin qui a suspendu
    const suspendedByAdmin = user.suspended_by ? 
      suspendedByData.find(admin => admin.id === user.suspended_by) : null;
    
    return {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sans nom',
      email: user.email || '',
      type: user.user_type,
      phone: user.phone,
      city: user.city,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      hasAdminRole,
      // Informations de suspension
      suspended: user.is_suspended || false,
      suspendedAt: user.suspended_at,
      suspendedBy: suspendedByAdmin ? 
        `${suspendedByAdmin.first_name || ''} ${suspendedByAdmin.last_name || ''}`.trim() 
        : null,
      suspensionReason: user.suspension_reason
    };
  }).filter(user => !user.hasAdminRole) || []; // Exclure les utilisateurs avec des rôles admin

  return (
    <UsersClient 
      initialUsers={users} 
      currentUserRole={currentUserProfile?.role || 'admin'}
      currentUserPermissions={currentUserProfile?.permissions || []}
    />
  );
}