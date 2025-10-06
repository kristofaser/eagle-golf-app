import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🟢 [START] API accept invitation démarrée');

    // 1. Récupérer les données
    const body = await request.json();
    const { token, password } = body;

    console.log('🟢 [STEP 1] Données reçues - Token:', token?.substring(0, 10) + '...');

    if (!token || !password) {
      console.log('❌ [STEP 1] Token ou mot de passe manquant');
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // 2. Valider la force du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial' },
        { status: 400 }
      );
    }

    console.log('🟢 [STEP 2] Validation mot de passe OK');

    const serviceClient = await createServiceClient();
    console.log('🟢 [STEP 3] Service client créé');

    // 3. Vérifier que le token est valide
    await serviceClient.rpc('expire_old_invitations');
    console.log('🟢 [STEP 3] RPC expire_old_invitations exécuté');

    const { data: invitation, error: invitationError } = await serviceClient
      .from('admin_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    console.log('🟢 [STEP 3] Invitation récupérée:', invitation ? 'trouvée' : 'non trouvée');
    if (invitationError) console.log('⚠️ [STEP 3] Erreur invitation:', invitationError);

    if (invitationError || !invitation) {
      console.log('❌ [STEP 3] Invitation invalide ou expirée');
      return NextResponse.json(
        { error: 'Invitation invalide ou expirée' },
        { status: 404 }
      );
    }

    // 4. Vérifier que l'email n'est pas déjà utilisé (double vérification)
    const { data: existingUser } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 409 }
      );
    }

    console.log('🟢 [STEP 4] Vérification email existant OK');

    // 5. Créer l'utilisateur dans auth.users
    console.log('🟢 [STEP 5] Création utilisateur auth - email:', invitation.email);
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        user_type: invitation.role
      }
    });

    if (authError || !authData.user) {
      console.error('❌ [STEP 5] Erreur création utilisateur:', JSON.stringify(authError, null, 2));
      return NextResponse.json(
        {
          error: 'Erreur lors de la création du compte',
          details: authError?.message || 'Unknown auth error'
        },
        { status: 500 }
      );
    }

    console.log('🟢 [STEP 5] Utilisateur auth créé - ID:', authData.user.id);

    // 6. Créer le profil dans profiles
    const profileData = {
      id: authData.user.id,
      email: invitation.email,
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      user_type: invitation.role,
      is_admin: true,
      admin_role: invitation.role,
      admin_permissions: invitation.permissions,
      admin_created_at: new Date().toISOString(),
      admin_created_by: invitation.invited_by
    };

    console.log('🔍 [DEBUG] Données profil à insérer:', JSON.stringify(profileData, null, 2));

    const { data: insertedProfile, error: profileError } = await serviceClient
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ [ERROR] Erreur création profil:', JSON.stringify(profileError, null, 2));
      console.error('❌ [ERROR] Profile data was:', JSON.stringify(profileData, null, 2));

      // Rollback: supprimer l'utilisateur auth
      await serviceClient.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        {
          error: 'Erreur lors de la création du profil',
          details: profileError.message || JSON.stringify(profileError)
        },
        { status: 500 }
      );
    }

    console.log('✅ [SUCCESS] Profil créé:', JSON.stringify(insertedProfile, null, 2));

    // 6.5. Vérification et correction si is_admin a été écrasé par un trigger
    if (insertedProfile && !insertedProfile.is_admin) {
      console.warn('⚠️ [WARNING] is_admin est false après insertion, correction en cours...');

      const { data: updatedProfile, error: updateError } = await serviceClient
        .from('profiles')
        .update({
          is_admin: true,
          admin_role: invitation.role,
          admin_permissions: invitation.permissions
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [ERROR] Impossible de corriger is_admin:', updateError);

        // Rollback: supprimer profil et utilisateur
        await serviceClient.from('profiles').delete().eq('id', authData.user.id);
        await serviceClient.auth.admin.deleteUser(authData.user.id);

        return NextResponse.json(
          { error: 'Erreur lors de la configuration du profil admin' },
          { status: 500 }
        );
      }

      console.log('✅ [SUCCESS] Profil corrigé:', JSON.stringify(updatedProfile, null, 2));
    }

    // 7. Marquer l'invitation comme acceptée
    const { error: updateError } = await serviceClient
      .from('admin_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Erreur mise à jour invitation:', updateError);
    }

    // 8. Connecter automatiquement l'utilisateur
    const { data: sessionData, error: sessionError } = await serviceClient.auth.signInWithPassword({
      email: invitation.email,
      password: password
    });

    if (sessionError || !sessionData.session) {
      console.error('Erreur connexion automatique:', sessionError);
      // Le compte est créé mais la connexion a échoué
      // L'utilisateur devra se connecter manuellement
      return NextResponse.json({
        success: true,
        message: 'Compte créé avec succès. Veuillez vous connecter.',
        redirectTo: '/login'
      });
    }

    // 9. Succès avec session
    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      session: sessionData.session,
      redirectTo: '/dashboard'
    });

  } catch (error) {
    console.error('❌ [FATAL ERROR] Erreur API /api/admin/invite/accept:', error);
    console.error('❌ [STACK TRACE]:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Erreur serveur interne',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
