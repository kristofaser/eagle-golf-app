import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔥 API Pro Validation appelée:', { requestId: params.id });
  
  try {
    const body = await request.json();
    const { action, admin_notes } = body;
    const requestId = params.id;
    
    console.log('📥 Données reçues:', { requestId, action, admin_notes, body });

    // Authentification admin réelle avec Supabase Auth
    console.log('🔐 Vérification authentification admin...');
    
    const supabase = await createServiceClient();
    
    // Créer un client avec les cookies pour récupérer la session
    const sessionClient = await createClient();
    
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erreur authentification:', authError);
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    console.log('👤 Utilisateur authentifié:', { user_id: user.id, email: user.email });
    
    // Récupérer le profil admin correspondant à cet utilisateur
    const { data: adminProfile, error: adminError } = await supabase
      .from('admin_profiles')
      .select(`
        id,
        role,
        permissions,
        first_name,
        last_name,
        email,
        is_active
      `)
      .eq('email', user.email)
      .eq('is_active', true)
      .single();
    
    if (adminError || !adminProfile) {
      console.error('❌ Profil admin non trouvé:', adminError);
      return NextResponse.json({ error: 'Accès non autorisé - profil admin introuvable' }, { status: 403 });
    }
    
    // Vérifier les permissions pour valider les demandes pro
    const canValidatePro = adminProfile.permissions?.includes('validate_pro_requests') || 
                          adminProfile.permissions?.includes('manage_users') || 
                          adminProfile.role === 'super_admin';
    
    if (!canValidatePro) {
      console.error('❌ Permissions insuffisantes:', adminProfile.role, adminProfile.permissions);
      return NextResponse.json({ error: 'Permissions insuffisantes pour valider les demandes pro' }, { status: 403 });
    }
    
    console.log('✅ Profil admin trouvé:', {
      admin_id: adminProfile.id,
      role: adminProfile.role,
      email: adminProfile.email
    });

    // Récupérer la demande de validation
    console.log('📚 Récupération demande de validation...', { requestId });
    const { data: proRequest, error: requestError } = await supabase
      .from('pro_validation_requests')
      .select(`
        *,
        user_profile:profiles!user_id (
          id,
          first_name,
          last_name,
          email,
          user_type
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('❌ Erreur récupération demande:', requestError);
      return NextResponse.json({ error: 'Erreur lors de la récupération de la demande' }, { status: 500 });
    }
    
    if (!proRequest) {
      console.error('❌ Demande non trouvée:', requestId);
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }
    
    if (proRequest.status !== 'pending') {
      console.error('❌ Demande déjà traitée:', proRequest.status);
      return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 400 });
    }
    
    console.log('✅ Demande trouvée:', { 
      id: proRequest.id, 
      status: proRequest.status, 
      user_id: proRequest.user_id 
    });

    // Valider l'action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Utiliser la fonction PostgreSQL pour valider la demande
    console.log('💾 Appel fonction validate_pro_request...', { 
      requestId, 
      adminId: adminProfile.id, 
      action 
    });
    
    const { data, error: validateError } = await supabase.rpc('validate_pro_request', {
      p_request_id: requestId,
      p_admin_id: adminProfile.id,
      p_action: action,
      p_admin_notes: admin_notes || null
    });

    if (validateError) {
      console.error('❌ Erreur fonction validate_pro_request:', validateError);
      throw new Error(`Erreur lors de la validation: ${validateError.message}`);
    }

    console.log('✅ Validation réussie via fonction PostgreSQL:', data);

    // Préparer la réponse
    const userFullName = `${proRequest.user_profile?.first_name || ''} ${proRequest.user_profile?.last_name || ''}`.trim();
    const successMessage = action === 'approve' 
      ? `Demande de ${userFullName} approuvée avec succès. L'utilisateur est maintenant professionnel.`
      : `Demande de ${userFullName} rejetée.`;

    return NextResponse.json({ 
      success: true, 
      message: successMessage,
      status: newStatus
    });

  } catch (error: unknown) {
    console.error('❌ ERREUR COMPLETE validation pro request:', {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}