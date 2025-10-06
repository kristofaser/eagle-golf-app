'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getAdminUser = async () => {
      try {
        // Récupérer l'utilisateur authentifié
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log('Pas d\'utilisateur authentifié');
          setAdminUser(null);
          setIsLoading(false);
          return;
        }

        // Vérifier si c'est un admin
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .select('id, email, user_type, is_admin')
          .eq('id', user.id)
          .eq('is_admin', true)
          .single();

        if (adminError || !adminProfile) {
          console.log('Utilisateur non admin');
          setAdminUser(null);
          setIsLoading(false);
          return;
        }

        setAdminUser({
          id: adminProfile.id,
          email: adminProfile.email,
          role: adminProfile.user_type,
          isActive: true // Tous les admins avec is_admin = true sont actifs
        });

        console.log('👤 Admin connecté:', {
          id: adminProfile.id,
          email: adminProfile.email,
          role: adminProfile.role
        });

      } catch (error) {
        console.error('Erreur lors de la récupération de l\'admin:', error);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getAdminUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Changement d\'auth:', event);
        if (event === 'SIGNED_OUT') {
          setAdminUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          getAdminUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    adminUser,
    isLoading,
    isAdmin: !!adminUser?.isActive
  };
}