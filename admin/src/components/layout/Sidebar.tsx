'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  BarChart3,
  MessageSquare,
  LogOut,
  Plane,
  Crown,
  Shield,
  UserCheck,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Gestion des utilisateurs', href: '/users', icon: Users },
  { name: 'Demandes pro', href: '/pro-requests', icon: UserCheck },
  { name: 'Réservations', href: '/bookings', icon: Calendar },
  { name: 'Parcours', href: '/courses', icon: MapPin },
  { name: 'Voyages', href: '/voyages', icon: Plane },
  { name: 'Premium', href: '/premium', icon: Crown },
  { name: 'Paiements', href: '/payments', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Support', href: '/support', icon: MessageSquare },
];

// Navigation pour super admin uniquement
const adminNavigation = [
  { name: 'Administration système', href: '/admin/users', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdminRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('user_type, is_admin')
          .eq('id', user.id)
          .eq('is_admin', true)
          .single();

        setIsSuperAdmin(adminProfile?.user_type === 'super_admin');
      }
    };

    checkSuperAdminRole();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      router.push('/login');
    } else {
      console.error('Erreur lors de la déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-semibold text-white">Eagle Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        
        {/* Section Administration système (super admin uniquement) */}
        {isSuperAdmin && (
          <>
            <div className="border-t border-gray-700 my-4"></div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
        </button>
      </div>
    </div>
  );
}