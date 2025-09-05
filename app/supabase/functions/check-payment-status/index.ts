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
    const { payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      throw new Error('ID Payment Intent manquant');
    }

    // Récupérer le statut du Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    // Vérifier que l'utilisateur a le droit de voir ce paiement
    const amateurId = paymentIntent.metadata?.amateur_id;
    if (amateurId !== user.id) {
      throw new Error('Accès non autorisé à ce paiement');
    }

    const isSuccessful = paymentIntent.status === 'succeeded';

    // Log pour debug
    console.log(`Payment Intent ${payment_intent_id} status: ${paymentIntent.status}`);

    return new Response(
      JSON.stringify({
        success: isSuccessful,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erreur vérification paiement:', error);

    return new Response(
      JSON.stringify({
        success: false,
        payment_intent_id: '',
        error: error.message || 'Erreur interne du serveur',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
