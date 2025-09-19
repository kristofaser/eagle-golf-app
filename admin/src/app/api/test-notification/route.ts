import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, data } = body;

    console.log('🧪 Test notification backend:', { type, title, message });

    // Créer directement la notification via insertion SQL
    const supabase = await createServiceClient();

    // Récupérer les admins actifs
    const { data: admins, error: adminError } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('is_active', true);

    if (adminError || !admins || admins.length === 0) {
      console.error('Erreur récupération admins:', adminError);
      return NextResponse.json(
        { error: 'Aucun admin actif trouvé' },
        { status: 404 }
      );
    }

    // Créer une notification pour chaque admin
    let notificationCount = 0;
    for (const admin of admins) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          type: type,
          title: title,
          message: message,
          data: data || {}
        });

      if (!insertError) {
        notificationCount++;
      } else {
        console.error('Erreur insertion notification pour admin', admin.id, ':', insertError);
      }
    }

    console.log('✅ Notification backend créée:', notificationCount, 'notifications envoyées');

    return NextResponse.json({
      success: true,
      notificationsCreated: notificationCount,
      message: `${notificationCount} notification(s) créée(s) avec succès`
    });

  } catch (error) {
    console.error('Erreur API test-notification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du test de notification' },
      { status: 500 }
    );
  }
}