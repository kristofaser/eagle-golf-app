import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vrpsulmidpgxmkybgtwn.supabase.co',
  process.env.SK,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { error } = await supabase.auth.admin.deleteUser('1107fce9-c1e7-4c5e-a407-b61f4e1a1731');
console.log(error ? '❌ Erreur: ' + error.message : '✅ Auth user supprimé');
