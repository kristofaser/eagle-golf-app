'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getProAvailabilities } from '@/app/(admin)/users/actions/availabilities';
import { ProAvailabilityCalendar } from './ProAvailabilityCalendar';

interface ProAvailability {
  id: string;
  pro_id: string;
  golf_course_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  current_bookings: number;
  is_available: boolean;
  golf_parcours?: {
    name: string;
    city: string;
  };
}

interface ProAvailabilitiesSectionProps {
  proId: string;
}

export default function ProAvailabilitiesSection({ proId }: ProAvailabilitiesSectionProps) {
  const [availabilities, setAvailabilities] = useState<ProAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<{ date: Date; availabilities: ProAvailability[] } | null>(null);

  useEffect(() => {
    const loadAvailabilities = async () => {
      setLoading(true);
      try {
        const result = await getProAvailabilities(proId);
        if (result.success) {
          setAvailabilities(result.data);
        } else {
          console.error('Erreur chargement disponibilités:', result.error);
          setAvailabilities([]);
        }
      } catch (error) {
        console.error('Erreur chargement disponibilités:', error);
        setAvailabilities([]);
      } finally {
        setLoading(false);
      }
    };

    if (proId) {
      loadAvailabilities();
    }
  }, [proId]);

  const handleDateClick = (date: Date, dayAvailabilities: any[]) => {
    // Retrouver les disponibilités complètes à partir des IDs
    const dateStr = format(date, 'yyyy-MM-dd');
    const fullAvailabilities = availabilities.filter(avail => avail.date === dateStr);
    setSelectedDate({ date, availabilities: fullAvailabilities });
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Disponibilités
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (availabilities.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Disponibilités
        </h3>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Aucune disponibilité configurée</span>
          </div>
        </div>
      </div>
    );
  }

  // Transformer les données pour le calendrier
  const calendarAvailabilities = availabilities.map((avail) => ({
    date: avail.date,
    golf_course_id: avail.golf_course_id,
    golf_course_name: avail.golf_parcours?.name || 'Parcours inconnu',
    is_available: avail.is_available,
    current_bookings: avail.current_bookings,
    max_players: avail.max_players,
  }));

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
        Disponibilités ({availabilities.length})
      </h3>

      {/* Calendrier */}
      <ProAvailabilityCalendar
        availabilities={calendarAvailabilities}
        onDateClick={handleDateClick}
      />

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-900">
              {format(selectedDate.date, 'EEEE dd MMMM yyyy', { locale: fr })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Fermer
            </button>
          </div>

          <div className="space-y-2">
            {selectedDate.availabilities.map((availability) => (
              <div key={availability.id} className="p-2 bg-white rounded border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {availability.golf_parcours?.name || 'Parcours inconnu'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    (availability.current_bookings || 0) < availability.max_players
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {availability.current_bookings || 0}/{availability.max_players} joueurs
                  </span>
                </div>
                {availability.golf_parcours?.city && (
                  <p className="text-xs text-gray-500 mt-1 ml-5">
                    {availability.golf_parcours.city}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}