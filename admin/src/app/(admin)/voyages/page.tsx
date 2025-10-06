'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MapPin, Users, Calendar, Bell, Edit2, Trash2, X, Upload, Image } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const tripSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  country: z.string().min(1, 'Le pays est requis'),
  image_url: z.string().min(1, 'Une image est requise'),
  status: z.enum(['available']),
});

type TripFormData = z.infer<typeof tripSchema>;

interface Trip {
  id: string;
  title: string;
  country: string;
  image_url: string;
  status: string;
  created_at: string;
}

interface UserWithAlerts {
  id: string;
  email: string;
  full_name: string;
  enabled: boolean;
  created_at: string;
}

export default function VoyagesPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [usersWithAlerts, setUsersWithAlerts] = useState<UserWithAlerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      status: 'available',
      image_url: '',
    },
  });

  const watchedImageUrl = watch('image_url');

  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupérer les voyages
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (tripsError) throw tripsError;
      setTrips(tripsData || []);

      // Récupérer les utilisateurs avec alertes activées
      const { data: alertsData, error: alertsError } = await supabase
        .from('user_travel_alerts')
        .select(`
          id,
          user_id,
          alerts_enabled,
          created_at
        `)
        .eq('alerts_enabled', true);

      if (alertsError) throw alertsError;

      // Récupérer les informations des utilisateurs séparément
      let formattedUsers: UserWithAlerts[] = [];

      if (alertsData && alertsData.length > 0) {
        const userIds = alertsData.map(alert => alert.user_id);

        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', userIds);

        if (usersError) {
          console.warn('Erreur lors de la récupération des utilisateurs:', usersError);
        }

        formattedUsers = alertsData.map((alert: any) => {
          const user = usersData?.find(u => u.id === alert.user_id);
          const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Utilisateur anonyme';
          return {
            id: alert.user_id,
            email: user?.email || 'Email non disponible',
            full_name: fullName || 'Utilisateur anonyme',
            enabled: alert.alerts_enabled,
            created_at: alert.created_at,
          };
        });
      }

      setUsersWithAlerts(formattedUsers);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: TripFormData) => {
    try {
      setSubmitting(true);

      if (isEditing && editingTrip) {
        // Modification d'un voyage existant
        const { error } = await supabase
          .from('trips')
          .update(data)
          .eq('id', editingTrip.id);

        if (error) throw error;
        alert('Voyage modifié avec succès !');
      } else {
        // Création d'un nouveau voyage
        const { error } = await supabase
          .from('trips')
          .insert([data]);

        if (error) throw error;
        alert('Voyage créé avec succès !');
      }

      reset();
      setIsEditing(false);
      setEditingTrip(null);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du voyage:', error);
      alert('Erreur lors de la sauvegarde du voyage');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `trips/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('La taille de l\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      setUploading(true);

      // Créer un aperçu local
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload vers Supabase
      const imageUrl = await uploadImage(file);
      setValue('image_url', imageUrl);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsEditing(true);
    setImagePreview(trip.image_url);
    reset({
      title: trip.title,
      country: trip.country,
      image_url: trip.image_url,
      status: 'available',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTrip(null);
    setImagePreview(null);
    reset({
      title: '',
      country: '',
      image_url: '',
      status: 'available',
    });
  };

  const handleDeleteTrip = async (trip: Trip) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le voyage "${trip.title}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', trip.id);

      if (error) throw error;

      alert('Voyage supprimé avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la suppression du voyage:', error);
      alert('Erreur lors de la suppression du voyage');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Voyages</p>
              <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Utilisateurs avec alertes</p>
              <p className="text-2xl font-bold text-gray-900">{usersWithAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Voyages disponibles</p>
              <p className="text-2xl font-bold text-gray-900">
                {trips.filter(trip => trip.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de création */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center">
              {isEditing ? (
                <>
                  <Edit2 className="h-5 w-5 mr-2" />
                  Modifier le voyage
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Créer un nouveau voyage
                </>
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du voyage
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Marrakech Golf Experience"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                {...register('country')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: Maroc"
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image du voyage
              </label>

              {/* Zone d'upload */}
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer transition-colors"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-gray-600">Upload en cours...</p>
                    </div>
                  ) : imagePreview || watchedImageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview || watchedImageUrl}
                        alt="Aperçu"
                        className="w-32 h-24 object-cover rounded-lg mx-auto"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop';
                        }}
                      />
                      <p className="text-sm text-gray-600">Cliquer pour changer l'image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Cliquer pour télécharger une image
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF jusqu'à 5MB
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Input hidden pour le formulaire */}
                <input
                  {...register('image_url')}
                  type="hidden"
                />
              </div>

              {errors.image_url && (
                <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
              )}
            </div>

            <input type="hidden" {...register('status')} value="available" />
          </div>

          <div className="mt-6">
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isEditing ? (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {submitting ? 'Modification...' : 'Modifier le voyage'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {submitting ? 'Création...' : 'Créer le voyage'}
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Liste des voyages */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Voyages existants</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voyage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={trip.image_url}
                        alt={trip.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&h=100&fit=crop';
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{trip.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(trip.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {trips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun voyage créé pour le moment
            </div>
          )}
        </div>
      </div>

      {/* Liste des utilisateurs avec alertes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Utilisateurs avec alertes voyage
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alertes depuis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersWithAlerts.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <Bell className="h-3 w-3 inline mr-1" />
                      Alertes activées
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersWithAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur avec alertes activées
            </div>
          )}
        </div>
      </div>
    </div>
  );
}