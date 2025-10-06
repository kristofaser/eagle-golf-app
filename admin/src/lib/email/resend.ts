import { Resend } from 'resend';

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.API_RESEND_SUPABASE_SMTP);

interface SendInvitationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  role: string;
  invitedBy: string;
  invitationUrl: string;
}

export async function sendAdminInvitationEmail({
  to,
  firstName,
  lastName,
  role,
  invitedBy,
  invitationUrl
}: SendInvitationEmailParams) {
  try {
    const roleLabel = role === 'super_admin' ? 'Super Administrateur' : 'Administrateur';
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Nouvel administrateur';

    const { data, error } = await resend.emails.send({
      from: 'Eagle Admin <noreply@eaglegolf.fr>',
      to: [to],
      subject: 'Invitation à rejoindre l\'équipe Eagle Admin',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation Eagle Admin</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        Eagle Admin
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                        Bonjour ${fullName},
                      </h2>

                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        ${invitedBy} vous invite à rejoindre l'équipe d'administration d'Eagle en tant que <strong>${roleLabel}</strong>.
                      </p>

                      <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Cliquez sur le bouton ci-dessous pour créer votre compte et définir votre mot de passe :
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 10px 0;">
                            <a href="${invitationUrl}"
                               style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                              Créer mon compte
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Ou copiez ce lien dans votre navigateur :
                      </p>

                      <div style="padding: 12px; background-color: #f3f4f6; border-radius: 6px; word-break: break-all;">
                        <a href="${invitationUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                          ${invitationUrl}
                        </a>
                      </div>

                      <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>Ce lien est valide pendant 7 jours.</strong>
                      </p>

                      <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6; font-style: italic;">
                        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        L'équipe <strong>Eagle Golf</strong>
                      </p>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Eagle. Tous droits réservés.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Erreur envoi email Resend:', error);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    }

    console.log('Email d\'invitation envoyé avec succès:', data);
    return { success: true, data };

  } catch (error: any) {
    console.error('Erreur sendAdminInvitationEmail:', error);
    return { success: false, error: error.message };
  }
}
