import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from './useAuth';

export function useNotificationCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Erreur chargement compteur notifications:', error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Charger le compteur au montage et quand l'utilisateur change
  useEffect(() => {
    loadUnreadCount();
  }, [user?.id]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user?.id) return;

    // Créer la souscription realtime
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Recharger le compteur quand il y a un changement
          loadUnreadCount();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    unreadCount,
    loading,
    refresh: loadUnreadCount,
  };
}