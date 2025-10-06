'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import type { DashboardStats } from '@/types';

interface DashboardClientProps {
  stats: DashboardStats;
  recentBookings: Array<{
    id: number;
    user: string;
    pro: string;
    date: string;
    status: string;
  }>;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardClient({ stats, recentBookings }: DashboardClientProps) {
  
  const statsCards = [
    {
      name: 'Utilisateurs totaux',
      value: stats.totalUsers.toLocaleString('fr-FR'),
      change: `+${stats.userGrowth.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      name: 'Réservations actives',
      value: stats.activeBookings.toLocaleString('fr-FR'),
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Calendar,
    },
    {
      name: 'Revenus du mois',
      value: `€${stats.totalRevenue.toLocaleString('fr-FR')}`,
      change: `+${stats.revenueGrowth.toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      name: 'Pros actifs',
      value: stats.totalPros.toLocaleString('fr-FR'),
      change: '+4.5%',
      changeType: 'positive' as const,
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-100 p-3">
                <stat.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p
                className={cn(
                  'ml-2 flex items-baseline text-sm font-semibold',
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Réservations récentes</h3>
            <Link 
              href="/bookings" 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="px-6 py-4">
            <div className="flow-root">
              <ul className="-my-3 divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <li key={booking.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{booking.user}</p>
                        <p className="text-sm text-gray-500">
                          avec {booking.pro} - {booking.date}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          booking.status === 'confirmed' && 'bg-green-100 text-green-800',
                          booking.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                          booking.status === 'cancelled' && 'bg-red-100 text-red-800',
                          booking.status === 'completed' && 'bg-blue-100 text-blue-800'
                        )}
                      >
                        {booking.status === 'confirmed' && 'Confirmée'}
                        {booking.status === 'pending' && 'En attente'}
                        {booking.status === 'cancelled' && 'Annulée'}
                        {booking.status === 'completed' && 'Terminée'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Actions en attente</h3>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-3">
              {stats.pendingProRequests > 0 && (
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-sm text-gray-900">
                      {stats.pendingProRequests} demande{stats.pendingProRequests > 1 ? 's' : ''} pro à valider
                    </span>
                  </div>
                  <Link 
                    href="/pro-requests" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir
                  </Link>
                </li>
              )}
              
              {stats.pendingValidations > 0 && (
                <li className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="text-sm text-gray-900">
                      {stats.pendingValidations} réservation{stats.pendingValidations > 1 ? 's' : ''} en attente
                    </span>
                  </div>
                  <Link 
                    href="/bookings" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir
                  </Link>
                </li>
              )}
              
              <li className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900">2 parcours à approuver</span>
                </div>
                <Link 
                  href="/courses" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Voir
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Alerts pour demandes pro urgentes */}
      {stats.pendingProRequests > 5 && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Attention : {stats.pendingProRequests} demandes professionnelles en attente
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Plusieurs demandes de conversion en compte professionnel attendent validation.
              </p>
            </div>
            <Link
              href="/pro-requests"
              className="ml-3 bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Traiter les demandes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}