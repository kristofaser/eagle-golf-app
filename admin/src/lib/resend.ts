import { Resend } from 'resend';

if (!process.env.API_RESEND_SUPABASE_SMTP) {
  throw new Error('API_RESEND_SUPABASE_SMTP environment variable is required');
}

export const resend = new Resend(process.env.API_RESEND_SUPABASE_SMTP);

// Configuration des emails
export const EMAIL_CONFIG = {
  from: 'Eagle Golf <onboarding@resend.dev>', // À remplacer par votre domaine vérifié
  replyTo: 'noreply@eagle-golf.com',
} as const;

export interface EmailTemplate {
  to: string[];
  subject: string;
  html: string;
}

// Template pour nouvelle demande professionnelle
export function createProRequestEmailTemplate(
  adminEmails: string[],
  demandeur: {
    nom: string;
    email: string;
    phone: string;
    siret: string;
    company_status: string;
    price_18_holes_1_player?: number;
  },
  requestId: string
): EmailTemplate {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/pro-requests/${requestId}`;

  return {
    to: adminEmails,
    subject: `🆕 Nouvelle demande professionnelle - ${demandeur.nom}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle demande professionnelle</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e1f5fe;">
              <h1 style="color: #0277bd; margin: 0; font-size: 24px;">🏌️ Eagle Golf</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Administration</p>
            </div>

            <!-- Alerte -->
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 25px;">
              <h2 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">🆕 Nouvelle demande professionnelle</h2>
              <p style="margin: 0; color: #555;">Un utilisateur vient de soumettre une demande de validation professionnelle qui nécessite votre attention.</p>
            </div>

            <!-- Informations du demandeur -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">👤 Informations du demandeur</h3>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; width: 120px; color: #666; font-weight: 500;">Nom :</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 600;">${demandeur.nom}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 500;">Email :</td>
                  <td style="padding: 8px 0; color: #0277bd;"><a href="mailto:${demandeur.email}" style="color: #0277bd; text-decoration: none;">${demandeur.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 500;">Téléphone :</td>
                  <td style="padding: 8px 0; color: #333;"><a href="tel:${demandeur.phone}" style="color: #333; text-decoration: none;">${demandeur.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 500;">SIRET :</td>
                  <td style="padding: 8px 0; color: #333; font-family: monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px; display: inline-block;">${demandeur.siret}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 500;">Statut :</td>
                  <td style="padding: 8px 0; color: #333;">
                    <span style="background-color: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${demandeur.company_status}</span>
                  </td>
                </tr>
                ${demandeur.price_18_holes_1_player ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: 500;">Tarif 18 trous :</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 600;">${demandeur.price_18_holes_1_player}€</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Actions -->
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${dashboardUrl}"
                 style="display: inline-block; background-color: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 0 10px 10px 0;">
                📋 Voir la demande
              </a>
              <a href="${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/pro-requests"
                 style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 0 10px 10px 0;">
                📊 Toutes les demandes
              </a>
            </div>

            <!-- Instructions -->
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin-bottom: 25px;">
              <h4 style="color: #f57c00; margin: 0 0 10px 0; font-size: 14px;">📝 Prochaines étapes</h4>
              <ol style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li>Vérifiez les documents d'identité fournis</li>
                <li>Validez les informations SIRET</li>
                <li>Contrôlez les tarifs proposés</li>
                <li>Approuvez ou rejetez la demande avec commentaires</li>
              </ol>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
              <p style="margin: 0 0 5px 0;">Eagle Golf - Plateforme d'administration</p>
              <p style="margin: 0;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
            </div>

          </div>
        </body>
      </html>
    `
  };
}