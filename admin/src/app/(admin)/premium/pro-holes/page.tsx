'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flag, Plus, Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import VideoUploadZone from '@/components/features/premium/VideoUploadZone';
import {
  uploadVideoToScaleway,
  deleteVideoFromScaleway,
  generateProHoleKey,
  getPublicUrl,
} from '@/lib/scaleway';

const holeSchema = z.object({
  hole_number: z.number().min(1).max(18),
  par: z.number().refine((val) => [3, 4, 5].includes(val), {
    message: 'Le par doit être 3, 4 ou 5',
  }),
  score: z.number().min(1).max(20),
});

type HoleFormData = z.infer<typeof holeSchema>;

interface ProHoleVideo {
  id: string;
  pro_id: string;
  hole_number: number;
  video_key: string;
  par: number;
  score: number;
  created_at: string;
  updated_at: string;
}

interface Pro {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  hole_videos: ProHoleVideo[];
}

export default function ProHolesPage() {
  const [pros, setPros] = useState<Pro[]>([]);
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHole, setEditingHole] = useState<ProHoleVideo | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [expandedProId, setExpandedProId] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HoleFormData>({
    resolver: zodResolver(holeSchema),
    defaultValues: {
      par: 4,
      score: 4,
    },
  });

  useEffect(() => {
    fetchPros();
  }, []);

  const fetchPros = async () => {
    try {
      setLoading(true);

      // Récupérer tous les pros validés
      const { data: proProfilesData, error: proError } = await supabase
        .from('pro_profiles')
        .select('user_id')
        .eq('validation_status', 'approved');

      if (proError) throw proError;

      // Récupérer les infos des users
      const userIds = proProfilesData?.map((p) => p.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Récupérer toutes les vidéos de trous
      const { data: holeVideosData, error: holesError } = await supabase
        .from('pro_hole_videos')
        .select('*')
        .order('hole_number');

      if (holesError) throw holesError;

      // Merger les données
      const prosData = proProfilesData?.map((pro) => {
        const user = usersData?.find((u) => u.id === pro.user_id);
        const videos = holeVideosData?.filter((v) => v.pro_id === pro.user_id) || [];
        return {
          id: pro.user_id, // Utiliser user_id comme id
          user_id: pro.user_id,
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          hole_videos: videos,
        };
      });

      setPros(prosData || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
  };

  const onSubmit = async (data: HoleFormData) => {
    if (!selectedPro) {
      alert('Veuillez sélectionner un pro');
      return;
    }

    if (!videoFile && !isEditing) {
      alert('Veuillez sélectionner une vidéo');
      return;
    }

    // Vérifier qu'on ne dépasse pas 3 vidéos
    if (!isEditing && selectedPro.hole_videos.length >= 3) {
      alert('Un pro ne peut avoir que 3 vidéos maximum');
      return;
    }

    try {
      setUploading(true);

      let videoKey = '';
      let holeId = '';

      if (isEditing && editingHole) {
        // Mode édition
        holeId = editingHole.id;
        videoKey = editingHole.video_key;

        // Si nouvelle vidéo, uploader
        if (videoFile) {
          await deleteVideoFromScaleway(videoKey);
          await uploadVideoToScaleway(videoFile, videoKey);
        }

        // Mettre à jour la vidéo de trou
        const { error: updateError } = await supabase
          .from('pro_hole_videos')
          .update({
            hole_number: data.hole_number,
            par: data.par,
            score: data.score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', holeId);

        if (updateError) throw updateError;

        alert('Vidéo de trou modifiée avec succès !');
      } else {
        // Mode création
        holeId = crypto.randomUUID();
        videoKey = generateProHoleKey(selectedPro.user_id, holeId);

        // Upload vidéo
        await uploadVideoToScaleway(videoFile!, videoKey);

        // Créer la vidéo de trou
        const { error: insertError } = await supabase
          .from('pro_hole_videos')
          .insert([
            {
              id: holeId,
              pro_id: selectedPro.user_id,
              hole_number: data.hole_number,
              video_key: videoKey,
              par: data.par,
              score: data.score,
            },
          ]);

        if (insertError) throw insertError;

        alert('Vidéo de trou créée avec succès !');
      }

      handleCancelEdit();
      fetchPros();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la vidéo de trou');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPro = (pro: Pro) => {
    setSelectedPro(pro);
    setIsEditing(false);
    setEditingHole(null);
    setVideoFile(null);
    reset({
      hole_number: 1,
      par: 4,
      score: 4,
    });
  };

  const handleEditHole = (hole: ProHoleVideo) => {
    setEditingHole(hole);
    setIsEditing(true);
    setVideoFile(null);
    reset({
      hole_number: hole.hole_number,
      par: hole.par,
      score: hole.score,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingHole(null);
    setVideoFile(null);
    setSelectedPro(null);
    reset({
      hole_number: 1,
      par: 4,
      score: 4,
    });
  };

  const handleDeleteHole = async (hole: ProHoleVideo) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la vidéo du trou ${hole.hole_number} ?`)) {
      return;
    }

    try {
      // Supprimer vidéo
      await deleteVideoFromScaleway(hole.video_key);

      // Supprimer l'entrée
      const { error } = await supabase
        .from('pro_hole_videos')
        .delete()
        .eq('id', hole.id);

      if (error) throw error;

      alert('Vidéo de trou supprimée avec succès !');
      fetchPros();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la vidéo de trou');
    }
  };

  const toggleProExpand = (proUserId: string) => {
    setExpandedProId(expandedProId === proUserId ? null : proUserId);
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
          <Flag className="h-6 w-6 mr-2" />
          Parcours 3 Trous - Gestion
        </h1>
        <p className="text-gray-600 mt-2">
          Gérer les 3 vidéos de trous par pro avec scores en overlay (max 3 vidéos/pro)
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Pros</p>
          <p className="text-2xl font-bold text-gray-900">{pros.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Pros avec Vidéos</p>
          <p className="text-2xl font-bold text-green-600">
            {pros.filter((p) => p.hole_videos.length > 0).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Vidéos</p>
          <p className="text-2xl font-bold text-blue-600">
            {pros.reduce((acc, p) => acc + p.hole_videos.length, 0)}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      {selectedPro && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              {isEditing ? (
                <>
                  <Edit2 className="h-5 w-5 mr-2" />
                  Modifier vidéo - {selectedPro.first_name} {selectedPro.last_name}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle vidéo - {selectedPro.first_name} {selectedPro.last_name}
                </>
              )}
            </h2>
            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro du trou *
                </label>
                <input
                  {...register('hole_number', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1-18"
                />
                {errors.hole_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.hole_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Par *</label>
                <select
                  {...register('par', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={3}>Par 3</option>
                  <option value={4}>Par 4</option>
                  <option value={5}>Par 5</option>
                </select>
                {errors.par && <p className="mt-1 text-sm text-red-600">{errors.par.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score réalisé *
                </label>
                <input
                  {...register('score', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Score"
                />
                {errors.score && <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>}
              </div>
            </div>

            <VideoUploadZone
              onVideoSelect={handleVideoSelect}
              currentVideoUrl={
                videoFile
                  ? URL.createObjectURL(videoFile)
                  : editingHole
                  ? getPublicUrl(editingHole.video_key)
                  : null
              }
              isUploading={uploading}
              maxSizeMB={100}
            />

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isEditing ? (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {uploading ? 'Modification...' : 'Modifier la vidéo'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {uploading ? 'Création...' : 'Créer la vidéo'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des pros */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Pros</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {pros.map((pro) => (
            <div key={pro.id}>
              {/* En-tête du pro */}
              <div
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                onClick={() => toggleProExpand(pro.user_id)}
              >
                <div className="flex items-center space-x-4">
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedProId === pro.user_id ? 'rotate-180' : ''
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pro.first_name} {pro.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pro.hole_videos.length} / 3 vidéos
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPro(pro);
                  }}
                  disabled={pro.hole_videos.length >= 3}
                  className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {pro.hole_videos.length >= 3 ? 'Max atteint (3/3)' : 'Ajouter vidéo'}
                </button>
              </div>

              {/* Vidéos du pro (expansible) */}
              {expandedProId === pro.user_id && pro.hole_videos.length > 0 && (
                <div className="px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pro.hole_videos.map((hole) => (
                      <div key={hole.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Trou #{hole.hole_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              Par {hole.par} - Score {hole.score}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                handleSelectPro(pro);
                                handleEditHole(hole);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteHole(hole)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <video
                          src={getPublicUrl(hole.video_key)}
                          controls
                          className="w-full h-32 rounded object-cover bg-black"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune vidéo */}
              {expandedProId === pro.user_id && pro.hole_videos.length === 0 && (
                <div className="px-6 py-4 bg-gray-50">
                  <p className="text-sm text-gray-500 text-center">
                    Aucune vidéo de trou pour ce pro
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {pros.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun pro trouvé</div>
        )}
      </div>
    </div>
  );
}
