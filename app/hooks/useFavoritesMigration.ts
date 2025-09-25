/**
 * Hook pour gérer la migration des favoris existants vers le nouveau système par utilisateur
 * Ce hook s'exécute au démarrage de l'app pour migrer les anciens favoris
 */
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

const MIGRATION_KEY = 'favorites-migration-completed';

interface LegacyAppState {
  favoritePros?: string[];
  favoriteParcours?: string[];
  userFavorites?: Record<string, { favoritePros: string[]; favoriteParcours: string[] }>;
  currentUserId?: string | null;
}

export function useFavoritesMigration() {
  const { user } = useAuth();
  const { setCurrentUser } = useAppStore();

  useEffect(() => {
    const migrateFavorites = async () => {
      try {
        // Vérifier si la migration a déjà été effectuée
        const migrationCompleted = await AsyncStorage.getItem(MIGRATION_KEY);
        if (migrationCompleted === 'true') {
          logger.dev('Migration des favoris déjà effectuée');
          return;
        }

        logger.dev('🔄 Début de migration des favoris...');

        // Récupérer les données du store actuel
        const storeData = await AsyncStorage.getItem('eagle-app-store');
        if (!storeData) {
          logger.dev('Aucune donnée de store trouvée, migration terminée');
          await AsyncStorage.setItem(MIGRATION_KEY, 'true');
          return;
        }

        const parsedData = JSON.parse(storeData) as LegacyAppState;

        // Vérifier s'il y a des favoris dans l'ancien format (sans userFavorites)
        const hasLegacyFavorites =
          (parsedData.favoritePros && parsedData.favoritePros.length > 0) ||
          (parsedData.favoriteParcours && parsedData.favoriteParcours.length > 0);

        const hasUserFavorites =
          parsedData.userFavorites && Object.keys(parsedData.userFavorites).length > 0;

        if (hasLegacyFavorites && !hasUserFavorites) {
          logger.dev('📦 Favoris legacy détectés, migration en cours...');

          // Si l'utilisateur est connecté, migrer ses favoris vers le nouveau format
          if (user?.id) {
            const migratedData = {
              ...parsedData,
              userFavorites: {
                [user.id]: {
                  favoritePros: parsedData.favoritePros || [],
                  favoriteParcours: parsedData.favoriteParcours || [],
                },
              },
              currentUserId: user.id,
            };

            // Sauvegarder les données migrées
            await AsyncStorage.setItem('eagle-app-store', JSON.stringify(migratedData));

            // Recharger les favoris de l'utilisateur
            setCurrentUser(user.id);

            logger.dev(`✅ Favoris migrés pour l'utilisateur ${user.id}`);
            logger.dev(
              `📊 ${parsedData.favoritePros?.length || 0} pros, ${parsedData.favoriteParcours?.length || 0} parcours`
            );
          } else {
            // Utilisateur non connecté, on garde les favoris mais on les vide de l'état actuel
            const migratedData = {
              ...parsedData,
              userFavorites: {},
              currentUserId: null,
              favoritePros: [],
              favoriteParcours: [],
            };

            await AsyncStorage.setItem('eagle-app-store', JSON.stringify(migratedData));
            logger.dev(
              '📝 Favoris legacy sauvegardés mais non assignés (utilisateur non connecté)'
            );
          }
        }

        // Marquer la migration comme terminée
        await AsyncStorage.setItem(MIGRATION_KEY, 'true');
        logger.dev('✅ Migration des favoris terminée');
      } catch (error) {
        logger.error('❌ Erreur lors de la migration des favoris:', error);
        // En cas d'erreur, marquer quand même la migration comme terminée pour éviter les boucles
        void AsyncStorage.setItem(MIGRATION_KEY, 'true');
      }
    };

    void migrateFavorites();
  }, [user?.id, setCurrentUser]);

  // Hook utilitaire pour forcer la remigration (développement uniquement)
  const resetMigration = async () => {
    if (process.env.NODE_ENV === 'development') {
      await AsyncStorage.removeItem(MIGRATION_KEY);
      logger.dev('🔄 Flag de migration reset (dev mode)');
    }
  };

  return { resetMigration };
}
