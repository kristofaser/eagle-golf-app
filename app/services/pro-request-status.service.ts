import { supabase } from '@/utils/supabase/client';

export interface ProRequestStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  validated_at: string | null;
  admin_notes: string | null;
  phone_number: string;
  siret: string;
  company_status: string;
  date_of_birth: string | null;
  id_card_front_url: string;
  id_card_back_url: string;
}

export interface UserProRequestResult {
  hasRequest: boolean;
  request: ProRequestStatus | null;
  canMakeNewRequest: boolean;
  status?: 'none' | 'pending' | 'approved' | 'rejected';
}

/**
 * Vérifie le statut de la demande professionnelle d'un utilisateur
 */
export async function checkUserProRequestStatus(userId: string): Promise<UserProRequestResult> {
  try {
    console.log('🔍 Vérification statut demande pro pour utilisateur:', userId);

    // Récupérer la demande la plus récente de l'utilisateur
    const { data: request, error } = await supabase
      .from('pro_validation_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Utiliser maybeSingle pour éviter l'erreur si pas de résultat

    if (error) {
      console.error('❌ Erreur lors de la vérification de la demande pro:', error);
      return {
        hasRequest: false,
        request: null,
        canMakeNewRequest: true,
        status: 'none',
      };
    }

    if (!request) {
      console.log('✅ Aucune demande pro trouvée - peut faire une nouvelle demande');
      return {
        hasRequest: false,
        request: null,
        canMakeNewRequest: true,
        status: 'none',
      };
    }

    console.log('📋 Demande pro trouvée:', {
      id: request.id,
      status: request.status,
      created_at: request.created_at,
    });

    // Déterminer si l'utilisateur peut faire une nouvelle demande
    const canMakeNewRequest = request.status === 'rejected';

    return {
      hasRequest: true,
      request: request as ProRequestStatus,
      canMakeNewRequest,
      status: request.status as 'pending' | 'approved' | 'rejected',
    };
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la vérification:', error);
    return {
      hasRequest: false,
      request: null,
      canMakeNewRequest: true,
      status: 'none',
    };
  }
}

/**
 * Formater une date pour l'affichage
 */
export function formatRequestDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculer le nombre de jours depuis la demande
 */
export function getDaysSinceRequest(dateString: string): number {
  const requestDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - requestDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Obtenir un message de délai estimé
 */
export function getEstimatedDelay(daysSinceRequest: number): string {
  if (daysSinceRequest <= 2) {
    return 'Délai habituel : 2-5 jours ouvrés';
  } else if (daysSinceRequest <= 5) {
    return "Votre demande est en cours d'examen";
  } else {
    return "Nos équipes finalisent l'examen de votre dossier";
  }
}

/**
 * Obtenir la couleur du statut pour l'UI
 */
export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
      };
    case 'approved':
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
      };
    case 'rejected':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-200',
      };
  }
}

/**
 * Obtenir le libellé du statut en français
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'En attente de validation';
    case 'approved':
      return 'Approuvée';
    case 'rejected':
      return 'Non validée';
    default:
      return 'Statut inconnu';
  }
}
