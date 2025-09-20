/**
 * Store pour la gestion des professionnels de golf
 * Centralise les données et l'état de chargement des pros
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { JoueurData } from '@/components/molecules/ContentCard';
import { profileService } from '@/services/profile.service';

interface ProsState {
  // Données
  prosNearMe: JoueurData[];
  prosLeague1: JoueurData[];
  prosLeague2: JoueurData[];
  prosAvailable: JoueurData[];
  allPros: JoueurData[];

  // État de chargement
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  lastFetch: number | null;

  // Actions
  loadPros: (forceRefresh?: boolean) => Promise<void>;
  refreshPros: () => Promise<void>;
  setProsNearMe: (pros: JoueurData[]) => void;
  setProsLeague1: (pros: JoueurData[]) => void;
  setProsLeague2: (pros: JoueurData[]) => void;
  setProsAvailable: (pros: JoueurData[]) => void;
  clearPros: () => void;
  setError: (error: Error | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProsStore = create<ProsState>()(
  devtools(
    (set, get) => ({
      // État initial
      prosNearMe: [],
      prosLeague1: [],
      prosLeague2: [],
      prosAvailable: [],
      allPros: [],
      loading: false,
      refreshing: false,
      error: null,
      lastFetch: null,

      // Charger les pros
      loadPros: async (forceRefresh = false) => {
        const state = get();

        // Vérifier le cache
        if (!forceRefresh && state.lastFetch && Date.now() - state.lastFetch < CACHE_DURATION) {
          return; // Utiliser les données en cache
        }

        set({ loading: true, error: null });

        try {
          const { data: pros, error: prosError } = await profileService.listProProfiles(
            {},
            { limit: 50 }
          );

          if (prosError) throw prosError;

          if (!pros || pros.length === 0) {
            set({
              allPros: [],
              prosAvailable: [],
              prosNearMe: [],
              prosLeague1: [],
              prosLeague2: [],
              loading: false,
              lastFetch: Date.now(),
            });
            return;
          }

          // Transformer les données
          const transformedPros: JoueurData[] = pros
            .map((pro) => {
              const proProfile = pro.pro_profiles;

              if (!proProfile) return null;

              const specialties = proProfile.specialties || [];
              const playStyle = proProfile.play_style || [];

              return {
                id: pro.id,
                title: `${pro.first_name} ${pro.last_name}`,
                imageUrl:
                  pro.avatar_url ||
                  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
                type: 'joueur' as const,
                age: 30 + Math.floor(Math.random() * 15),
                region: pro.city || 'Paris',
                handicap: proProfile.handicap ? `+${proProfile.handicap}` : '+0',
                scoreAverage: 72 - (proProfile.handicap || 0),
                specialite: specialties.join(', ') || 'Polyvalent',
                styleJeu: playStyle.join(', ') || 'Adaptatif',
                experience: proProfile.years_experience || 5,
                circuits: proProfile.professional_status || 'Professionnel',
                meilleurResultat: proProfile.certifications?.join(', ') || 'Certifié PGA',
                victoires: Math.floor(Math.random() * 10) + 1,
                tarif: '120€', // Prix par défaut, sera remplacé par les vrais prix depuis pro_pricing
                rating: 4.5 + Math.random() * 0.5,
                isPremium: false, // À déterminer selon les prix dans pro_pricing
                isAvailable: false, // TODO: Charger les disponibilités
              };
            })
            .filter(Boolean) as JoueurData[];

          // Catégoriser les pros
          const nearMe = transformedPros.slice(0, 4);
          const league1 = transformedPros.filter((p) => p.isPremium).slice(0, 4);
          const league2 = transformedPros.filter((p) => !p.isPremium).slice(0, 4);
          const available = transformedPros.filter((p) => p.isAvailable);

          set({
            allPros: transformedPros,
            prosNearMe: nearMe,
            prosLeague1: league1,
            prosLeague2: league2,
            prosAvailable: available,
            loading: false,
            lastFetch: Date.now(),
          });
        } catch (error) {
          set({
            error: error as Error,
            loading: false,
          });
        }
      },

      // Rafraîchir les pros
      refreshPros: async () => {
        set({ refreshing: true });
        const state = get();
        await state.loadPros(true);
        set({ refreshing: false });
      },

      // Setters individuels
      setProsNearMe: (pros) => set({ prosNearMe: pros }),
      setProsLeague1: (pros) => set({ prosLeague1: pros }),
      setProsLeague2: (pros) => set({ prosLeague2: pros }),
      setProsAvailable: (pros) => set({ prosAvailable: pros }),

      // Clear
      clearPros: () =>
        set({
          prosNearMe: [],
          prosLeague1: [],
          prosLeague2: [],
          prosAvailable: [],
          allPros: [],
          error: null,
          lastFetch: null,
        }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'ProsStore',
    }
  )
);

// Sélecteurs optimisés
export const useProsNearMe = () => useProsStore((state) => state.prosNearMe);
export const useProsLeague1 = () => useProsStore((state) => state.prosLeague1);
export const useProsLeague2 = () => useProsStore((state) => state.prosLeague2);
export const useProsAvailable = () => useProsStore((state) => state.prosAvailable);
export const useProsLoading = () => useProsStore((state) => state.loading);
export const useProsRefreshing = () => useProsStore((state) => state.refreshing);
export const useProsError = () => useProsStore((state) => state.error);
