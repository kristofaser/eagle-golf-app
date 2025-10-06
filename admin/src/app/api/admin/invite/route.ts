import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendAdminInvitationEmail } from '@/lib/email/resend';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérifier que l'utilisateur est super_admin
    const serviceClient = await createServiceClient();
    const { data: adminProfile } = await serviceClient
      .from('profiles')
      .select('user_type, is_admin')
      .eq('id', user.id)
      .eq('is_admin', true)
      .eq('user_type', 'super_admin')
      .single();

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les super_admin peuvent inviter des administrateurs.' },
        { status: 403 }
      );
    }

    // 3. Récupérer et valider les données
    const body = await request.json();
    const { email, firstName, lastName, role, permissions } = body;

    // Validation basique
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email et rôle sont requis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Validation rôle
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // 4. Vérifier que l'email n'est pas déjà utilisé
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé par un utilisateur existant' },
        { status: 409 }
      );
    }

    // 5. Vérifier qu'il n'y a pas d'invitation pending pour cet email
    const { data: existingInvitation } = await serviceClient
      .from('admin_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Une invitation est déjà en attente pour cet email' },
        { status: 409 }
      );
    }

    // 6. Générer un token sécurisé
    const invitationToken = crypto.randomUUID();

    // 7. Calculer la date d'expiration (7 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 8. Créer l'invitation
    const { data: invitation, error: invitationError } = await serviceClient
      .from('admin_invitations')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        permissions: permissions || [],
        invitation_token: invitationToken,
        token_expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Erreur création invitation:', invitationError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      );
    }

    // 9. Récupérer le nom de l'inviteur
    const { data: inviterProfile } = await serviceClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim()
      : 'Un administrateur';

    // 10. Envoyer l'email d'invitation via Resend
    const invitationUrl = `${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/admin-invitation/${invitationToken}`;

    const emailResult = await sendAdminInvitationEmail({
      to: email,
      firstName: firstName || '',
      lastName: lastName || '',
      role,
      invitedBy: inviterName,
      invitationUrl
    });

    if (!emailResult.success) {
      console.error('Erreur envoi email:', emailResult.error);
      // On ne bloque pas l'invitation si l'email échoue
      // L'admin peut toujours copier le lien manuellement
    }

    // 11. Retourner succès
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.token_expires_at,
        invitationUrl: `${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/admin-invitation/${invitationToken}`
      }
    });

  } catch (error) {
    console.error('Erreur API /api/admin/invite:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
