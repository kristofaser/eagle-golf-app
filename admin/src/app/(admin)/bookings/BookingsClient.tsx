'use client';

import { Calendar, Clock, MapPin, User, Eye, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import BookingSidebar from '@/components/features/bookings/BookingSidebar';

interface BookingsClientProps {
  initialBookings: Array<{
    id: string;
    golfer: string;
    pro: string;
    course: string;
    date: string;
    time: string;
    status: string;
    price: string;
    createdAt: string;
    fullData: any;
  }>;
  stats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    pendingValidation: number;
  };
}

export default function BookingsClient({ initialBookings, stats }: BookingsClientProps) {
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Fonction pour ouvrir la sidebar avec une réservation
  const handleOpenSidebar = (booking: { fullData: any }) => {
    setSelectedBooking(booking.fullData);
    setIsSidebarOpen(true);
  };

  // Fonction pour fermer la sidebar
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedBooking(null);
  };

  // Fonction pour valider une réservation depuis la sidebar
  const handleValidateBooking = async (bookingId: string, action: string, notes?: string, alternativeDate?: string, alternativeTime?: string) => {
    try {
      console.log('🔄 Tentative de validation:', { bookingId, action, notes, alternativeDate, alternativeTime });
      
      const response = await fetch(`/api/bookings/${bookingId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          admin_notes: notes,
          alternative_date: alternativeDate,
          alternative_time: alternativeTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Validation réussie:', result);

      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur validation complète:', error);
      throw error; // Relancer l'erreur pour que la sidebar puisse la gérer
    }
  };

  // Filtrer les réservations
  const filteredBookings = useMemo(() => {
    if (filter === 'all') return initialBookings;
    return initialBookings.filter(booking => booking.status === filter);
  }, [initialBookings, filter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les réservations de cours entre amateurs et professionnels
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmées</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Annulées</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <Calendar className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">À valider</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingValidation}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'confirmed' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Confirmées
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'cancelled' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Annulées
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          En attente validation
        </button>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredBookings.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Golfeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professionnel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parcours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenSidebar(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{booking.golfer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.pro}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {booking.course}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(booking.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        {booking.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSidebar(booking);
                      }}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        booking.status === 'pending'
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={booking.status === 'pending' ? 'Valider la réservation' : 'Voir les détails'}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {booking.status === 'pending' ? 'Valider' : 'Voir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filter === 'all' 
              ? 'Aucune réservation trouvée'
              : `Aucune réservation ${getStatusLabel(filter).toLowerCase()} trouvée`
            }
          </div>
        )}
      </div>

      {/* Sidebar de validation */}
      <BookingSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        booking={selectedBooking}
        onValidate={handleValidateBooking}
      />
    </div>
  );
}