'use client';

import { useState, useEffect } from 'react';
import { Package, Check, X, Video as VideoIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import VideoUploadZone from '@/components/features/premium/VideoUploadZone';
import {
  uploadVideoToScaleway,
  deleteVideoFromScaleway,
  generateInTheBagKey,
  getPublicUrl,
} from '@/lib/scaleway';

interface Pro {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  has_bag_video: boolean;
  bag_video_updated_at: string | null;
}

export default function InTheBagPage() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPros();
  }, []);

  const fetchPros = async () => {
    try {
      setLoading(true);

      // Récupérer tous les pros validés
      const { data: proProfilesData, error: proError } = await supabase
        .from('pro_profiles')
        .select('user_id, has_bag_video, bag_video_updated_at, validation_status')
        .eq('validation_status', 'approved');

      if (proError) throw proError;

      // Récupérer les infos des users
      const userIds = proProfilesData?.map((p) => p.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Merger les données
      const prosData = proProfilesData?.map((pro) => {
        const user = usersData?.find((u) => u.id === pro.user_id);
        return {
          id: pro.user_id, // Utiliser user_id comme id
          user_id: pro.user_id,
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          has_bag_video: pro.has_bag_video || false,
          bag_video_updated_at: pro.bag_video_updated_at,
        };
      });

      setPros(prosData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des pros:', error);
      alert('Erreur lors du chargement des pros');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
  };

  const handleUpload = async () => {
    if (!selectedPro || !videoFile) {
      alert('Veuillez sélectionner un pro et une vidéo');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload vidéo vers Scaleway
      const objectKey = generateInTheBagKey(selectedPro.user_id);
      const videoUrl = await uploadVideoToScaleway(videoFile, objectKey);

      // 2. Mettre à jour pro_profiles
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({
          has_bag_video: true,
          bag_video_updated_at: new Date().toISOString(),
        })
        .eq('user_id', selectedPro.user_id);

      if (updateError) throw updateError;

      alert('Vidéo In the Bag uploadée avec succès !');
      setVideoFile(null);
      setSelectedPro(null);
      fetchPros();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de la vidéo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pro: Pro) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la vidéo In the Bag de ${pro.first_name} ${pro.last_name} ?`)) {
      return;
    }

    try {
      // 1. Supprimer vidéo de Scaleway
      const objectKey = generateInTheBagKey(pro.user_id);
      await deleteVideoFromScaleway(objectKey);

      // 2. Mettre à jour pro_profiles
      const { error: updateError } = await supabase
        .from('pro_profiles')
        .update({
          has_bag_video: false,
          bag_video_updated_at: null,
        })
        .eq('user_id', pro.user_id);

      if (updateError) throw updateError;

      alert('Vidéo supprimée avec succès !');
      fetchPros();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la vidéo');
    }
  };

  const getVideoUrl = (pro: Pro): string | null => {
    if (!pro.has_bag_video) return null;
    return getPublicUrl(generateInTheBagKey(pro.user_id));
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Package className="h-6 w-6 mr-2" />
          In the Bag - Gestion Vidéos
        </h1>
        <p className="text-gray-600 mt-2">
          Gérer les vidéos où les pros expliquent leur équipement
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <VideoIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pros</p>
              <p className="text-2xl font-bold text-gray-900">{pros.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avec Vidéo</p>
              <p className="text-2xl font-bold text-gray-900">
                {pros.filter((p) => p.has_bag_video).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <X className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sans Vidéo</p>
              <p className="text-2xl font-bold text-gray-900">
                {pros.filter((p) => !p.has_bag_video).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire upload */}
      {selectedPro && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Upload vidéo pour {selectedPro.first_name} {selectedPro.last_name}
            </h2>
            <button
              onClick={() => {
                setSelectedPro(null);
                setVideoFile(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <VideoUploadZone
            onVideoSelect={handleVideoSelect}
            currentVideoUrl={videoFile ? URL.createObjectURL(videoFile) : getVideoUrl(selectedPro)}
            isUploading={uploading}
            maxSizeMB={100}
          />

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!videoFile || uploading}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {uploading ? 'Upload en cours...' : 'Uploader la vidéo'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des pros */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Pros</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut Vidéo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière MAJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pros.map((pro) => (
                <tr key={pro.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pro.first_name} {pro.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pro.has_bag_video ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <Check className="h-3 w-3 inline mr-1" />
                        Vidéo uploadée
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        <X className="h-3 w-3 inline mr-1" />
                        Pas de vidéo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pro.bag_video_updated_at
                      ? new Date(pro.bag_video_updated_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPro(pro)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {pro.has_bag_video ? 'Remplacer' : 'Ajouter'}
                      </button>
                      {pro.has_bag_video && (
                        <button
                          onClick={() => handleDelete(pro)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pros.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun pro trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
