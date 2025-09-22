import { BaseService, ServiceResponse, PaginationParams, SortParams } from './base.service';
import { Tables, TablesInsert, TablesUpdate } from '@/utils/supabase/types';
import { WithDetails, FilterParams } from '@/types/utils';
import { logger } from '@/utils/logger';

export type Profile = Tables<'profiles'>;
export type ProProfile = Tables<'pro_profiles'>;
export type AmateurProfile = Tables<'amateur_profiles'>;
export type GolfCourseSubmission = Tables<'golf_course_submissions'>;

// Types enrichis avec détails
export type ProProfileWithDetails = WithDetails<Profile, { pro_profiles: ProProfile }>;
export type AmateurProfileWithDetails = WithDetails<Profile, { amateur_profiles: AmateurProfile }>;

// Type unifié pour les profils complets
export type FullProfile = Profile & {
  amateur_profiles?: AmateurProfile | null;
  pro_profiles?: ProProfile | null;
  email?: string | null;
};

// Type pour les filtres de recherche de professionnels
export type ProSearchFilters = FilterParams<{
  city?: string;
}>;

export interface UpdateProfileData {
  profile?: TablesUpdate<'profiles'>;
  proProfile?: TablesUpdate<'pro_profiles'>;
  amateurProfile?: TablesUpdate<'amateur_profiles'>;
}

class ProfileService extends BaseService {
  /**
   * Récupère un profil par ID
   */
  async getProfile(userId: string): Promise<ServiceResponse<Profile>> {
    return await this.handleResponse<Profile>(
      await this.supabase.from('profiles').select('*').eq('id', userId).single()
    );
  }

  /**
   * Récupère un profil complet avec toutes les données (amateur ou pro)
   */
  async getFullProfile(userId: string): Promise<ServiceResponse<FullProfile>> {
    try {
      // Récupérer le profil de base
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return {
          data: null,
          error: profileError || new Error('Profil non trouvé'),
        };
      }

      // Récupérer l'email depuis auth.users
      const {
        data: { user },
      } = await this.supabase.auth.admin
        .getUserById(userId)
        .catch(() => ({ data: { user: null } }));

      const fullProfile: FullProfile = {
        ...profile,
        email: profile.email || user?.email || null,
      };

      // Récupérer les données spécifiques selon le type
      if (profile.user_type === 'amateur') {
        const { data: amateurProfile } = await this.supabase
          .from('amateur_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        fullProfile.amateur_profiles = amateurProfile;
      } else if (profile.user_type === 'pro') {
        const { data: proProfile } = await this.supabase
          .from('pro_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        fullProfile.pro_profiles = proProfile;
      }

      return {
        data: fullProfile,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère un profil pro complet avec détails
   */
  async getProProfile(userId: string): Promise<ServiceResponse<ProProfileWithDetails>> {
    return await this.handleResponse<ProProfileWithDetails>(
      await this.supabase
        .from('profiles')
        .select(
          `
          *,
          pro_profiles(*)
        `
        )
        .eq('id', userId)
        .eq('user_type', 'pro')
        .single()
    );
  }

  /**
   * Récupère un profil amateur complet avec détails
   */
  async getAmateurProfile(userId: string): Promise<ServiceResponse<AmateurProfileWithDetails>> {
    return await this.handleResponse<AmateurProfileWithDetails>(
      await this.supabase
        .from('profiles')
        .select(
          `
          *,
          amateur_profiles!inner(*)
        `
        )
        .eq('id', userId)
        .eq('user_type', 'amateur')
        .single()
    );
  }

  /**
   * Liste tous les profils pros avec filtres
   */
  async listProProfiles(
    filters?: ProSearchFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ServiceResponse<ProProfileWithDetails[]>> {
    let query = this.supabase
      .from('profiles')
      .select(
        `
        *,
        pro_profiles!inner(*)
      `,
        { count: 'exact' }
      )
      .eq('user_type', 'pro');

    // Appliquer les filtres
    if (filters) {
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
    }

    // Tri
    if (sort?.sortBy) {
      const column = sort.sortBy.includes('.') ? sort.sortBy : `pro_profiles.${sort.sortBy}`;
      query = query.order(column, { ascending: sort.sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    if (pagination) {
      const { from, to } = this.getPaginationRange(pagination);
      query = query.range(from, to);
    }

    return this.handleResponse<ProProfileWithDetails[]>(await query);
  }

  /**
   * Met à jour un profil complet
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<ServiceResponse<Profile>> {
    try {
      logger.dev('[ProfileService] updateProfile appelé pour user:', userId);
      logger.dev('[ProfileService] Données reçues:', JSON.stringify(data, null, 2));

      // Mettre à jour le profil principal
      if (data.profile) {
        logger.dev('[ProfileService] Mise à jour du profil principal...');
        const { error: profileError } = await this.supabase
          .from('profiles')
          .update({
            ...data.profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          logger.error('[ProfileService] Erreur mise à jour profil:', profileError);
          throw profileError;
        }
        logger.dev('[ProfileService] Profil principal mis à jour avec succès');
      }

      // Mettre à jour le profil pro
      if (data.proProfile) {
        logger.dev('[ProfileService] Mise à jour du profil pro...');
        const { error: proError } = await this.supabase
          .from('pro_profiles')
          .update(data.proProfile)
          .eq('user_id', userId);

        if (proError) {
          logger.error('[ProfileService] Erreur mise à jour profil pro:', proError);
          throw proError;
        }
        logger.dev('[ProfileService] Profil pro mis à jour avec succès');
      }

      // Mettre à jour le profil amateur
      if (data.amateurProfile) {
        logger.dev('[ProfileService] Mise à jour du profil amateur...');
        const { error: amateurError } = await this.supabase
          .from('amateur_profiles')
          .update(data.amateurProfile)
          .eq('user_id', userId);

        if (amateurError) {
          logger.error('[ProfileService] Erreur mise à jour profil amateur:', amateurError);
          throw amateurError;
        }
        logger.dev('[ProfileService] Profil amateur mis à jour avec succès');
      }

      logger.dev('[ProfileService] Récupération du profil mis à jour...');
      // Retourner le profil mis à jour
      const result = await this.getProfile(userId);
      logger.dev('[ProfileService] Résultat getProfile:', result.error ? 'Erreur' : 'Succès');
      return result;
    } catch (error) {
      logger.error('[ProfileService] Erreur dans updateProfile:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupérer les pros qui ont des disponibilités sur un parcours spécifique
   */
  async getProsByGolfCourse(
    golfCourseId: string,
    options?: {
      onlyAvailable?: boolean;
      limit?: number;
    }
  ): Promise<ServiceResponse<ProProfileWithDetails[]>> {
    try {
      // D'abord, récupérer les IDs des pros qui ont des disponibilités sur ce parcours
      const today = new Date().toISOString().split('T')[0];

      let availabilityQuery = this.supabase
        .from('pro_availabilities')
        .select('pro_id')
        .eq('golf_course_id', golfCourseId)
        .gte('date', today); // Disponibilités futures uniquement

      // Si on veut seulement ceux qui ont des créneaux disponibles
      if (options?.onlyAvailable) {
        availabilityQuery = availabilityQuery.gt('max_players', 'current_bookings');
      }

      const { data: availabilities, error: availError } = await availabilityQuery;

      if (availError) {
        logger.error('[ProfileService] Erreur récupération disponibilités:', availError);
        throw availError;
      }

      if (!availabilities || availabilities.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      // Récupérer les IDs uniques des pros
      const proIds = [...new Set(availabilities.map((a) => a.pro_id))];

      // Maintenant récupérer les profils complets de ces pros
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select(
          `
          *,
          pro_profiles!inner(*)
        `
        )
        .in('id', proIds)
        .eq('user_type', 'pro')
        .limit(options?.limit || 20);

      if (profilesError) {
        logger.error('[ProfileService] Erreur récupération profils:', profilesError);
        throw profilesError;
      }

      return {
        data: profiles || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Soumettre un nouveau parcours de golf
   */
  async submitGolfCourse(
    data: TablesInsert<'golf_course_submissions'>
  ): Promise<ServiceResponse<GolfCourseSubmission>> {
    return await this.handleResponse<GolfCourseSubmission>(
      await this.supabase.from('golf_course_submissions').insert(data).select().single()
    );
  }

  /**
   * Créer une demande de validation pour devenir professionnel
   */
  async convertToPro(
    userId: string,
    proData: {
      date_of_birth: string;
      siret: string;
      company_status: string;
      phone_number: string;
      id_card_front_url?: string;
      id_card_back_url?: string;
      price_9_holes_1_player?: number;
      price_9_holes_2_players?: number;
      price_9_holes_3_players?: number;
      price_18_holes_1_player?: number;
      price_18_holes_2_players?: number;
      price_18_holes_3_players?: number;
    }
  ): Promise<ServiceResponse<{ request_id: string }>> {
    try {
      // Vérifier qu'aucune demande en cours n'existe déjà
      const { data: existingRequest } = await this.supabase
        .from('pro_validation_requests')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          throw new Error('Une demande de validation est déjà en cours de traitement.');
        } else if (existingRequest.status === 'approved') {
          throw new Error('Vous êtes déjà professionnel ou votre demande a été approuvée.');
        }
      }

      // Créer la demande de validation dans pro_validation_requests
      const { data: request, error } = await this.supabase
        .from('pro_validation_requests')
        .insert({
          user_id: userId,
          date_of_birth: proData.date_of_birth,
          siret: proData.siret,
          company_status: proData.company_status,
          phone_number: proData.phone_number,
          id_card_front_url: proData.id_card_front_url || null,
          id_card_back_url: proData.id_card_back_url || null,
          price_9_holes_1_player: proData.price_9_holes_1_player || null,
          price_9_holes_2_players: proData.price_9_holes_2_players || null,
          price_9_holes_3_players: proData.price_9_holes_3_players || null,
          price_18_holes_1_player: proData.price_18_holes_1_player || null,
          price_18_holes_2_players: proData.price_18_holes_2_players || null,
          price_18_holes_3_players: proData.price_18_holes_3_players || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        data: { request_id: request.id },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Vérifier le statut de la demande de validation pro
   */
  async getProRequestStatus(userId: string): Promise<
    ServiceResponse<{
      status: 'none' | 'pending' | 'approved' | 'rejected';
      request_id?: string;
      admin_notes?: string;
      created_at?: string;
      validated_at?: string;
    }>
  > {
    try {
      const { data: request, error } = await this.supabase
        .from('pro_validation_requests')
        .select('id, status, admin_notes, created_at, validated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!request) {
        return {
          data: { status: 'none' },
          error: null,
        };
      }

      return {
        data: {
          status: request.status as 'pending' | 'approved' | 'rejected',
          request_id: request.id,
          admin_notes: request.admin_notes,
          created_at: request.created_at,
          validated_at: request.validated_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Upload une photo de profil avec FormData (pour React Native)
   */
  async uploadAvatarWithFormData(
    userId: string,
    formData: FormData,
    fileName: string
  ): Promise<ServiceResponse<string>> {
    try {
      logger.dev('[ProfileService] Upload avatar avec FormData pour user:', userId);

      const filePath = `avatars/${userId}-${Date.now()}.jpg`; // Sous-dossier avatars dans le bucket profiles
      logger.dev('[ProfileService] Upload vers:', filePath);

      // Récupérer le fichier depuis FormData (React Native format)
      const file = formData.get('file') as any;

      if (!file || !file.uri) {
        throw new Error('Fichier invalide dans FormData');
      }

      logger.dev('[ProfileService] File URI:', file.uri);

      // En React Native, on ne peut pas utiliser blob.arrayBuffer()
      // On doit utiliser une approche différente avec FileReader
      const response = await fetch(file.uri);
      const blob = await response.blob();

      logger.dev('[ProfileService] Blob size:', blob.size, 'Type:', blob.type);

      // Utiliser FileReader pour convertir le blob en base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extraire seulement le base64 sans le préfixe data:image/jpeg;base64,
          const base64String = result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      logger.dev('[ProfileService] Base64 length:', base64.length);

      // Décoder le base64 en bytes pour l'upload
      const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const bytes = decode(base64);
      logger.dev('[ProfileService] Bytes length:', bytes.length);

      // Upload avec Uint8Array
      const { data, error: uploadError } = await this.supabase.storage
        .from('profiles')
        .upload(filePath, bytes, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        logger.error('[ProfileService] Erreur upload storage:', uploadError);
        throw uploadError;
      }

      logger.dev('[ProfileService] Upload réussi, data:', data);

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('profiles').getPublicUrl(filePath);

      logger.dev('[ProfileService] URL publique générée:', publicUrl);

      return {
        data: publicUrl,
        error: null,
      };
    } catch (error) {
      logger.error('[ProfileService] Erreur uploadAvatarWithFormData:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Upload une photo de profil
   */
  async uploadAvatar(userId: string, file: File | Blob): Promise<ServiceResponse<string>> {
    try {
      logger.dev('[ProfileService] Début upload avatar pour user:', userId);

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`; // Sous-dossier avatars dans le bucket profiles

      logger.dev('[ProfileService] Upload vers:', filePath);

      // Upload vers Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        logger.error('[ProfileService] Erreur upload storage:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('profiles').getPublicUrl(filePath);

      logger.dev('[ProfileService] URL publique générée:', publicUrl);

      // Ne plus mettre à jour automatiquement le profil ici
      // La mise à jour sera faite dans updateProfile avec les autres données

      return {
        data: publicUrl,
        error: null,
      };
    } catch (error) {
      logger.error('[ProfileService] Erreur uploadAvatar:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les statistiques d'un pro
   */
  async getProStats(proId: string): Promise<
    ServiceResponse<{
      totalBookings: number;
      completedBookings: number;
      averageRating: number;
      totalReviews: number;
      upcomingBookings: number;
    }>
  > {
    try {
      // Nombre total de parties
      const { count: totalBookings } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('pro_id', proId)
        .eq('status', 'completed');

      // Note moyenne
      const { data: reviews } = await this.supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', proId);

      const avgRating = reviews?.length
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

      // Revenus totaux
      const { data: payments } = await this.supabase
        .from('bookings')
        .select('pro_fee')
        .eq('pro_id', proId)
        .eq('status', 'completed');

      const totalEarnings = payments?.reduce((acc, p) => acc + p.pro_fee, 0) || 0;

      return {
        data: {
          totalBookings: totalBookings || 0,
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews?.length || 0,
          totalEarnings: totalEarnings / 100, // Convertir en euros
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
}

export const profileService = new ProfileService();
