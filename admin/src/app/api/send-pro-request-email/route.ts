import { NextRequest, NextResponse } from 'next/server';
import { resend, createProRequestEmailTemplate, EMAIL_CONFIG } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { demandeur, requestId, adminEmails } = body;

    console.log('📧 Envoi email nouvelle demande pro:', { requestId, demandeur: demandeur.nom });

    // Validation des données requises
    if (!demandeur || !requestId || !adminEmails || adminEmails.length === 0) {
      return NextResponse.json(
        { error: 'Données manquantes: demandeur, requestId et adminEmails requis' },
        { status: 400 }
      );
    }

    // Créer le template d'email
    const emailTemplate = createProRequestEmailTemplate(adminEmails, demandeur, requestId);

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: emailTemplate.to,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      reply_to: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Email envoyé avec succès:', data?.id);

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Email envoyé à ${adminEmails.length} admin(s)`,
      recipients: adminEmails
    });

  } catch (error) {
    console.error('❌ Erreur API send-pro-request-email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}