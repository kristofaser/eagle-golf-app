import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialiser Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialiser Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Parser les données de la requête
    const { amount, currency = 'eur', metadata } = await req.json();

    if (!amount || amount < 50) {
      // Minimum 0.50€
      throw new Error('Montant invalide (minimum 0.50€)');
    }

    // Créer le Payment Intent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Montant en centimes
      currency: currency.toLowerCase(),
      // Remplacer automatic_payment_methods par des méthodes spécifiques
      payment_method_types: ['card'],
      // Désactiver explicitement toutes les méthodes automatiques
      automatic_payment_methods: {
        enabled: false,
      },
      metadata: {
        ...metadata,
        amateur_id: user.id,
        created_at: new Date().toISOString(),
      },
      description: metadata.description || 'Réservation Eagle Golf',
    });

    // Log de l'intention de paiement pour debug
    console.log('Payment Intent créé:', paymentIntent.id);

    // Retourner le client secret pour l'app mobile
    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erreur création Payment Intent:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur interne du serveur',
        client_secret: '',
        payment_intent_id: '',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
