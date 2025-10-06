import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vrpsulmidpgxmkybgtwn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const userId = '04077e82-428f-4021-a2cd-3c37f3de4a0d';

(async () => {
  console.log('🗑️ Suppression de l\'utilisateur auth:', userId);

  const { data, error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Utilisateur supprimé avec succès');
  }
})();
