import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Récupérer le token depuis les query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant', valid: false },
        { status: 400 }
      );
    }

    // 2. Appeler la fonction pour marquer les invitations expirées
    const serviceClient = await createServiceClient();
    await serviceClient.rpc('expire_old_invitations');

    // 3. Rechercher l'invitation
    const { data: invitation, error } = await serviceClient
      .from('admin_invitations')
      .select('id, email, first_name, last_name, role, status, token_expires_at')
      .eq('invitation_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation introuvable', valid: false },
        { status: 404 }
      );
    }

    // 4. Vérifier le statut
    if (invitation.status === 'expired') {
      return NextResponse.json(
        {
          error: 'Cette invitation a expiré',
          valid: false,
          status: 'expired'
        },
        { status: 410 }
      );
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json(
        {
          error: 'Cette invitation a été révoquée',
          valid: false,
          status: 'revoked'
        },
        { status: 410 }
      );
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json(
        {
          error: 'Cette invitation a déjà été acceptée',
          valid: false,
          status: 'accepted'
        },
        { status: 410 }
      );
    }

    // 5. Vérifier l'expiration (double vérification)
    const expiresAt = new Date(invitation.token_expires_at);
    if (expiresAt < new Date()) {
      // Marquer comme expiré
      await serviceClient
        .from('admin_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        {
          error: 'Cette invitation a expiré',
          valid: false,
          status: 'expired'
        },
        { status: 410 }
      );
    }

    // 6. Invitation valide
    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        role: invitation.role,
        expiresAt: invitation.token_expires_at
      }
    });

  } catch (error) {
    console.error('Erreur API /api/admin/invite/validate:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne', valid: false },
      { status: 500 }
    );
  }
}
