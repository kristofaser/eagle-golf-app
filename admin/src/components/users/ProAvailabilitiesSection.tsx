'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getProAvailabilities } from '@/app/(admin)/users/actions/availabilities';

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
  golf_courses?: {
    name: string;
  };
}

interface ProAvailabilitiesSectionProps {
  proId: string;
}

export default function ProAvailabilitiesSection({ proId }: ProAvailabilitiesSectionProps) {
  const [availabilities, setAvailabilities] = useState<ProAvailability[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
        Disponibilités ({availabilities.length})
      </h3>
      <div className="space-y-2">
        {availabilities.map((availability) => (
          <div key={availability.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Date et heure */}
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(availability.date), 'EEEE dd MMMM', { locale: fr })}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {/* Horaires */}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{availability.start_time} - {availability.end_time}</span>
                  </div>
                  
                  {/* Capacité */}
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {availability.current_bookings || 0}/{availability.max_players} joueurs
                    </span>
                  </div>
                </div>

                {/* Parcours si disponible */}
                {availability.golf_courses?.name && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {availability.golf_courses.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Statut */}
              <div className="ml-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  availability.is_available && (availability.current_bookings || 0) < availability.max_players
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {availability.is_available && (availability.current_bookings || 0) < availability.max_players
                    ? 'Disponible'
                    : 'Complet'
                  }
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {availabilities.length === 10 && (
          <div className="text-center">
            <span className="text-xs text-gray-500">
              Affichage des 10 prochaines disponibilités
            </span>
          </div>
        )}
      </div>
    </div>
  );
}