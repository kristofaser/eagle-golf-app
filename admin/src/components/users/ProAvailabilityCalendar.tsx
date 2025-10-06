'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

interface ProAvailability {
  date: string;
  golf_course_id: string;
  golf_course_name?: string;
  is_available: boolean;
  current_bookings: number;
  max_players: number;
}

interface ProAvailabilityCalendarProps {
  availabilities: ProAvailability[];
  onDateClick?: (date: Date, availabilities: ProAvailability[]) => void;
}

export function ProAvailabilityCalendar({ availabilities, onDateClick }: ProAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Générer les jours du mois avec padding pour alignement
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lundi = 1
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Grouper les disponibilités par date
  const availabilitiesByDate = availabilities.reduce((acc, avail) => {
    const date = avail.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(avail);
    return acc;
  }, {} as Record<string, ProAvailability[]>);

  // Déterminer le statut d'une date
  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailabilities = availabilitiesByDate[dateStr] || [];

    if (dayAvailabilities.length === 0) {
      return { status: 'none', count: 0 };
    }

    const hasAvailable = dayAvailabilities.some(a => a.current_bookings < a.max_players);
    const hasBooked = dayAvailabilities.some(a => a.current_bookings > 0);
    const isFull = dayAvailabilities.every(a => a.current_bookings >= a.max_players);

    if (isFull) {
      return { status: 'full', count: dayAvailabilities.length };
    }
    if (hasBooked && hasAvailable) {
      return { status: 'partial', count: dayAvailabilities.length };
    }
    if (hasAvailable) {
      return { status: 'available', count: dayAvailabilities.length };
    }

    return { status: 'none', count: dayAvailabilities.length };
  };

  // Navigation mois
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Gérer le clic sur une date
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailabilities = availabilitiesByDate[dateStr] || [];

    if (dayAvailabilities.length > 0 && onDateClick) {
      onDateClick(date, dayAvailabilities);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-base font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {/* En-têtes jours de la semaine */}
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* Cases du calendrier */}
        {days.map((day) => {
          const { status, count } = getDateStatus(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          const hasAvailabilities = status !== 'none';

          return (
            <button
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              disabled={!hasAvailabilities}
              className={cn(
                'aspect-square p-1 rounded-lg text-sm font-medium transition-all relative',
                'hover:ring-2 hover:ring-offset-1',
                // État du mois
                !isCurrentMonth && 'text-gray-300',
                isCurrentMonth && !hasAvailabilities && 'text-gray-400',
                // Jour actuel
                isToday && 'ring-2 ring-blue-500 ring-offset-1',
                // Statuts disponibilité
                hasAvailabilities && isCurrentMonth && !isPast && [
                  status === 'available' && 'bg-green-100 text-green-800 hover:ring-green-500',
                  status === 'partial' && 'bg-orange-100 text-orange-800 hover:ring-orange-500',
                  status === 'full' && 'bg-yellow-100 text-yellow-800 hover:ring-yellow-500',
                ],
                // Passé
                isPast && hasAvailabilities && 'opacity-50',
                // Curseur
                hasAvailabilities && !isPast ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <span className="block">{format(day, 'd')}</span>
              {/* Badge nombre de parcours */}
              {hasAvailabilities && count > 1 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
          <span className="text-xs text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
          <span className="text-xs text-gray-600">Partiellement réservé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
          <span className="text-xs text-gray-600">Complet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
          <span className="text-xs text-gray-600">Non disponible</span>
        </div>
      </div>
    </div>
  );
}
