import { BaseService, ServiceResponse, PaginationParams, SortParams } from './base.service';
import { Tables, TablesInsert, TablesUpdate } from '@/utils/supabase/types';
import { WithDetails, FilterParams } from '@/types/utils';

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
  canTravel?: boolean;
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
    } catch (error: any) {
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
      if (filters.canTravel !== undefined) {
        query = query.eq('pro_profiles.can_travel', filters.canTravel);
      }
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
      console.log('[ProfileService] updateProfile appelé pour user:', userId);
      console.log('[ProfileService] Données reçues:', JSON.stringify(data, null, 2));

      // Mettre à jour le profil principal
      if (data.profile) {
        console.log('[ProfileService] Mise à jour du profil principal...');
        const { error: profileError } = await this.supabase
          .from('profiles')
          .update({
            ...data.profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          console.error('[ProfileService] Erreur mise à jour profil:', profileError);
          throw profileError;
        }
        console.log('[ProfileService] Profil principal mis à jour avec succès');
      }

      // Mettre à jour le profil pro
      if (data.proProfile) {
        console.log('[ProfileService] Mise à jour du profil pro...');
        const { error: proError } = await this.supabase
          .from('pro_profiles')
          .update(data.proProfile)
          .eq('user_id', userId);

        if (proError) {
          console.error('[ProfileService] Erreur mise à jour profil pro:', proError);
          throw proError;
        }
        console.log('[ProfileService] Profil pro mis à jour avec succès');
      }

      // Mettre à jour le profil amateur
      if (data.amateurProfile) {
        console.log('[ProfileService] Mise à jour du profil amateur...');
        const { error: amateurError } = await this.supabase
          .from('amateur_profiles')
          .update(data.amateurProfile)
          .eq('user_id', userId);

        if (amateurError) {
          console.error('[ProfileService] Erreur mise à jour profil amateur:', amateurError);
          throw amateurError;
        }
        console.log('[ProfileService] Profil amateur mis à jour avec succès');
      }

      console.log('[ProfileService] Récupération du profil mis à jour...');
      // Retourner le profil mis à jour
      const result = await this.getProfile(userId);
      console.log('[ProfileService] Résultat getProfile:', result.error ? 'Erreur' : 'Succès');
      return result;
    } catch (error: any) {
      console.error('[ProfileService] Erreur dans updateProfile:', error);
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
        console.error('[ProfileService] Erreur récupération disponibilités:', availError);
        throw availError;
      }

      if (!availabilities || availabilities.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      // Récupérer les IDs uniques des pros
      const proIds = [...new Set(availabilities.map(a => a.pro_id))];
      
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
        console.error('[ProfileService] Erreur récupération profils:', profilesError);
        throw profilesError;
      }

      return {
        data: profiles || [],
        error: null,
      };
    } catch (error: any) {
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
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        data: { request_id: request.id },
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Vérifier le statut de la demande de validation pro
   */
  async getProRequestStatus(userId: string): Promise<ServiceResponse<{
    status: 'none' | 'pending' | 'approved' | 'rejected';
    request_id?: string;
    admin_notes?: string;
    created_at?: string;
    validated_at?: string;
  }>> {
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
    } catch (error: any) {
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
      console.log('[ProfileService] Upload avatar avec FormData pour user:', userId);

      const filePath = `avatars/${userId}-${Date.now()}.jpg`;
      console.log('[ProfileService] Upload vers:', filePath);

      // Récupérer le fichier depuis FormData
      const file = formData.get('file') as any;

      // Pour React Native, utiliser une approche différente avec arrayBuffer
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();

      console.log('[ProfileService] ArrayBuffer size:', arrayBuffer.byteLength);

      // Convertir ArrayBuffer en Uint8Array pour Supabase
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload vers Supabase Storage avec le buffer
      const { data, error: uploadError } = await this.supabase.storage
        .from('profiles')
        .upload(filePath, uint8Array, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[ProfileService] Erreur upload storage:', uploadError);
        throw uploadError;
      }

      console.log('[ProfileService] Upload réussi, data:', data);

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('profiles').getPublicUrl(filePath);

      console.log('[ProfileService] URL publique générée:', publicUrl);

      return {
        data: publicUrl,
        error: null,
      };
    } catch (error: any) {
      console.error('[ProfileService] Erreur uploadAvatarWithFormData:', error);
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
      console.log('[ProfileService] Début upload avatar pour user:', userId);

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('[ProfileService] Upload vers:', filePath);

      // Upload vers Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('[ProfileService] Erreur upload storage:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('profiles').getPublicUrl(filePath);

      console.log('[ProfileService] URL publique générée:', publicUrl);

      // Ne plus mettre à jour automatiquement le profil ici
      // La mise à jour sera faite dans updateProfile avec les autres données

      return {
        data: publicUrl,
        error: null,
      };
    } catch (error: any) {
      console.error('[ProfileService] Erreur uploadAvatar:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les statistiques d'un pro
   */
  async getProStats(proId: string): Promise<ServiceResponse<any>> {
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
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
}

export const profileService = new ProfileService();
