import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vrpsulmidpgxmkybgtwn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { error } = await supabase.auth.admin.deleteUser('268a3dc0-8f3d-42bc-b376-2dc2be5e9a26');
  console.log(error ? '❌ Erreur' : '✅ Auth user supprimé');
})();
