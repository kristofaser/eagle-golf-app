'use client';

import { useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  total_amount: number;
  status: string;
  admin_validation_status?: string;
  amateur_id: string;
  pro_id: string;
  golf_course_id: string;
  special_requests?: string;
  number_of_players?: number;
  amateur?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  pro?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  golf_course?: {
    name: string;
    city?: string;
    postal_code?: string;
    department?: string;
    phone?: string;
    email?: string;
  };
}

interface BookingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingData | null;
  onValidate: (bookingId: string, action: string, notes?: string, alternativeDate?: string, alternativeTime?: string) => Promise<void>;
}

export default function BookingSidebar({ isOpen, onClose, booking, onValidate }: BookingSidebarProps) {
  const [action, setAction] = useState<'confirm' | 'reject' | 'alternative'>('confirm');
  const [adminNotes, setAdminNotes] = useState('');
  const [alternativeDate, setAlternativeDate] = useState('');
  const [alternativeTime, setAlternativeTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsSubmitting(true);
    try {
      await onValidate(
        booking.id,
        action,
        adminNotes,
        alternativeDate,
        alternativeTime
      );
      onClose();
      // Reset form
      setAction('confirm');
      setAdminNotes('');
      setAlternativeDate('');
      setAlternativeTime('');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Validation de réservation
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Informations de la réservation */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Détails de la réservation
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{formatDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Heure:</span>
                  <span className="text-sm">{formatTime(booking.start_time)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Amateur */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Amateur</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {booking.amateur?.first_name} {booking.amateur?.last_name}
                      </span>
                    </div>
                    {booking.amateur?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${booking.amateur.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {booking.amateur.email}
                        </a>
                      </div>
                    )}
                    {booking.amateur?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${booking.amateur.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {booking.amateur.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professionnel */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Professionnel</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {booking.pro?.first_name} {booking.pro?.last_name}
                      </span>
                    </div>
                    {booking.pro?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${booking.pro.email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {booking.pro.email}
                        </a>
                      </div>
                    )}
                    {booking.pro?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${booking.pro.phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {booking.pro.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Détails supplémentaires */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Montant:</span>
                    <span className="text-sm ml-2">{(booking.total_amount / 100).toFixed(0)}€</span>
                  </div>
                  {booking.number_of_players && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Joueurs:</span>
                      <span className="text-sm ml-2">{booking.number_of_players}</span>
                    </div>
                  )}
                </div>
                {booking.special_requests && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Demandes spéciales:</span>
                    <p className="text-sm mt-1 text-gray-600">{booking.special_requests}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations du parcours de golf */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Parcours de golf à contacter
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {booking.golf_course?.name || 'Parcours non défini'}
                  </h4>
                  {(booking.golf_course?.city || booking.golf_course?.postal_code) && (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {[booking.golf_course.city, booking.golf_course.postal_code, booking.golf_course.department]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contacts */}
                <div className="flex flex-wrap gap-4">
                  {booking.golf_course?.phone && (
                    <a
                      href={`tel:${booking.golf_course.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {booking.golf_course.phone}
                    </a>
                  )}
                  {booking.golf_course?.email && (
                    <a
                      href={`mailto:${booking.golf_course.email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {booking.golf_course.email}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Formulaire de validation */}
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Validation de la réservation
              </h3>

              {/* Actions */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="confirm"
                    checked={action === 'confirm'}
                    onChange={(e) => setAction(e.target.value as 'confirm' | 'reject' | 'alternative')}
                    className="text-green-600"
                  />
                  <span className="text-sm font-medium">Confirmer la réservation</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="alternative"
                    checked={action === 'alternative'}
                    onChange={(e) => setAction(e.target.value as 'confirm' | 'reject' | 'alternative')}
                    className="text-orange-600"
                  />
                  <span className="text-sm font-medium">Proposer une alternative</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value as 'confirm' | 'reject' | 'alternative')}
                    className="text-red-600"
                  />
                  <span className="text-sm font-medium">Refuser la réservation</span>
                </label>
              </div>

              {/* Alternative date/time */}
              {action === 'alternative' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date alternative
                    </label>
                    <input
                      type="date"
                      value={alternativeDate}
                      onChange={(e) => setAlternativeDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure alternative
                    </label>
                    <input
                      type="time"
                      value={alternativeTime}
                      onChange={(e) => setAlternativeTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Notes admin */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes administratives
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes sur l'appel, disponibilités, remarques..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Validation...' : 'Valider'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}