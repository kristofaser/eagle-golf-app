const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check auth.users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const user = authData.users.find(u => u.email === 'user2@cigalo.fr');

  if (user) {
    console.log('✅ Trouvé dans auth.users:', user.id);

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', 'user2@cigalo.fr');

    if (profileError) {
      console.error('❌ Erreur suppression profile:', profileError);
    } else {
      console.log('✅ Profile supprimé');
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('❌ Erreur suppression auth.users:', authError);
    } else {
      console.log('✅ Auth user supprimé');
    }

    // Revoke invitation
    const { error: inviteError } = await supabase
      .from('admin_invitations')
      .update({ status: 'revoked' })
      .eq('email', 'user2@cigalo.fr')
      .eq('status', 'pending');

    if (inviteError) {
      console.error('❌ Erreur révocation invitation:', inviteError);
    } else {
      console.log('✅ Invitation révoquée');
    }
  } else {
    console.log('ℹ️ user2@cigalo.fr n\'existe pas');
  }
})();
