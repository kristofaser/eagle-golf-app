const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4NDU3MiwiZXhwIjoyMDY4MTYwNTcyfQ.oCuTPSxWy6qellMYB4talX6qbfa3eabz556fX6J_Ruo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
  console.log('🔍 Vérification des logs et données...\n');

  // 1. Vérifier les payment_logs
  console.log('1️⃣ Payment Logs:');
  const { data: paymentLogs, error: paymentError } = await supabase
    .from('payment_logs')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(5);

  if (paymentError) {
    console.log('   ❌ Erreur:', paymentError.message);
  } else if (paymentLogs && paymentLogs.length > 0) {
    paymentLogs.forEach(log => {
      console.log(`   - ${log.payment_intent_id}: ${log.status} (${log.processed_at})`);
    });
  } else {
    console.log('   ⚠️ Aucun log de paiement trouvé');
  }

  // 2. Vérifier les réservations récentes
  console.log('\n2️⃣ Réservations récentes:');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, payment_status, admin_validation_status, payment_intent_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (bookingError) {
    console.log('   ❌ Erreur:', bookingError.message);
  } else if (bookings && bookings.length > 0) {
    bookings.forEach(booking => {
      console.log(`   - ID: ${booking.id.substring(0,8)}...`);
      console.log(`     Status: ${booking.status} | Payment: ${booking.payment_status} | Admin: ${booking.admin_validation_status}`);
      console.log(`     Payment Intent: ${booking.payment_intent_id || 'N/A'}`);
      console.log(`     Created: ${booking.created_at}\n`);
    });
  } else {
    console.log('   ⚠️ Aucune réservation trouvée');
  }

  // 3. Vérifier les validations admin
  console.log('\n3️⃣ Validations Admin:');
  const { data: validations, error: validationError } = await supabase
    .from('admin_booking_validations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (validationError) {
    console.log('   ❌ Erreur:', validationError.message);
  } else if (validations && validations.length > 0) {
    validations.forEach(val => {
      console.log(`   - Booking: ${val.booking_id.substring(0,8)}... | Status: ${val.status}`);
    });
  } else {
    console.log('   ⚠️ Aucune validation trouvée');
  }

  // 4. Statistiques
  console.log('\n4️⃣ Statistiques:');
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });
  
  const { count: confirmedBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
    
  const { count: pendingBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log(`   - Total réservations: ${totalBookings || 0}`);
  console.log(`   - Confirmées: ${confirmedBookings || 0}`);
  console.log(`   - En attente: ${pendingBookings || 0}`);
}

checkLogs().catch(console.error);