'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lightbulb, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import VideoUploadZone from '@/components/features/premium/VideoUploadZone';
import {
  uploadVideoToScaleway,
  deleteVideoFromScaleway,
  generateTipKey,
  getPublicUrl,
} from '@/lib/scaleway';

const tipSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  author_id: z.string().nullable(),
  published_at: z.string(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
});

type TipFormData = z.infer<typeof tipSchema>;

interface Tip {
  id: string;
  title: string;
  description: string | null;
  video_key: string;
  author_id: string | null;
  author_name: string | null;
  published_at: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  created_at: string;
}

interface Pro {
  id: string;
  first_name: string;
  last_name: string;
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TipFormData>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      is_active: true,
      published_at: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Récupérer les tips
      const { data: tipsData, error: tipsError } = await supabase
        .from('weekly_tips')
        .select('*')
        .order('published_at');

      if (tipsError) throw tipsError;

      // Récupérer les infos des auteurs (pros)
      const authorIds = tipsData?.map((t) => t.author_id).filter(Boolean) || [];
      let authorsData: any[] = [];

      if (authorIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', authorIds);
        authorsData = data || [];
      }

      // Merger les données
      const tipsWithAuthors = tipsData?.map((tip) => {
        const author = authorsData.find((a) => a.id === tip.author_id);
        return {
          ...tip,
          author_name: author
            ? `${author.first_name} ${author.last_name}`
            : tip.author_id
            ? 'Auteur inconnu'
            : 'Eagle Team',
        };
      });

      setTips(tipsWithAuthors || []);

      // Récupérer les pros pour le dropdown
      const { data: proProfilesData } = await supabase
        .from('pro_profiles')
        .select('user_id')
        .eq('validation_status', 'approved');

      if (proProfilesData && proProfilesData.length > 0) {
        const { data: prosData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', proProfilesData.map((p) => p.user_id));

        setPros(prosData || []);
      }
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

  const onSubmit = async (data: TipFormData) => {
    if (!videoFile && !isEditing) {
      alert('Veuillez sélectionner une vidéo');
      return;
    }

    try {
      setUploading(true);

      let videoKey = '';
      let tipId = '';

      if (isEditing && editingTip) {
        // Mode édition
        tipId = editingTip.id;
        videoKey = editingTip.video_key;

        // Si nouvelle vidéo, uploader
        if (videoFile) {
          await deleteVideoFromScaleway(videoKey);
          await uploadVideoToScaleway(videoFile, videoKey);
        }

        // Mettre à jour le tip
        const { error: updateError } = await supabase
          .from('weekly_tips')
          .update({
            title: data.title,
            description: data.description || null,
            author_id: data.author_id || null,
            published_at: data.published_at,
            expires_at: data.expires_at || null,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tipId);

        if (updateError) throw updateError;

        alert('Tip modifié avec succès !');
      } else {
        // Mode création
        tipId = crypto.randomUUID();
        videoKey = generateTipKey(tipId);

        // Upload vidéo
        await uploadVideoToScaleway(videoFile!, videoKey);

        // Créer le tip
        const { error: insertError } = await supabase
          .from('weekly_tips')
          .insert([{
            id: tipId,
            title: data.title,
            description: data.description || null,
            video_key: videoKey,
            author_id: data.author_id || null,
            published_at: data.published_at,
            expires_at: data.expires_at || null,
            is_active: data.is_active,
          }]);

        if (insertError) throw insertError;

        alert('Tip créé avec succès !');
      }

      handleCancelEdit();
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du tip');
    } finally {
      setUploading(false);
    }
  };

  const handleEditTip = (tip: Tip) => {
    setEditingTip(tip);
    setIsEditing(true);
    setVideoFile(null);
    reset({
      title: tip.title,
      description: tip.description || '',
      author_id: tip.author_id,
      published_at: tip.published_at.split('T')[0],
      expires_at: tip.expires_at ? tip.expires_at.split('T')[0] : '',
      is_active: tip.is_active,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTip(null);
    setVideoFile(null);
    reset({
      title: '',
      description: '',
      author_id: null,
      published_at: new Date().toISOString().split('T')[0],
      expires_at: '',
      is_active: true,
    });
  };

  const handleDeleteTip = async (tip: Tip) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tip "${tip.title}" ?`)) {
      return;
    }

    try {
      // Supprimer vidéo
      await deleteVideoFromScaleway(tip.video_key);

      // Supprimer tip
      const { error } = await supabase
        .from('weekly_tips')
        .delete()
        .eq('id', tip.id);

      if (error) throw error;

      alert('Tip supprimé avec succès !');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du tip');
    }
  };

  const toggleTipActive = async (tip: Tip) => {
    try {
      const { error } = await supabase
        .from('weekly_tips')
        .update({ is_active: !tip.is_active })
        .eq('id', tip.id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du statut');
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Lightbulb className="h-6 w-6 mr-2" />
          Tips de la Semaine - Gestion
        </h1>
        <p className="text-gray-600 mt-2">
          Gérer les tips vidéo (conseils courts 30s-2min)
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Tips</p>
          <p className="text-2xl font-bold text-gray-900">{tips.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Tips Actifs</p>
          <p className="text-2xl font-bold text-green-600">
            {tips.filter((t) => t.is_active).length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Vues Totales</p>
          <p className="text-2xl font-bold text-blue-600">
            {tips.reduce((acc, t) => acc + t.view_count, 0)}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            {isEditing ? (
              <>
                <Edit2 className="h-5 w-5 mr-2" />
                Modifier le tip
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Créer un nouveau tip
              </>
            )}
          </h2>
          {isEditing && (
            <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ex: Le secret du putting parfait"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auteur
              </label>
              <select
                {...register('author_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Eagle Team</option>
                {pros.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.first_name} {pro.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date publication *
              </label>
              <input
                {...register('published_at')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date expiration (optionnel)
              </label>
              <input
                {...register('expires_at')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Description courte du tip..."
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">Actif (visible par les users premium)</span>
            </label>
          </div>

          <VideoUploadZone
            onVideoSelect={handleVideoSelect}
            currentVideoUrl={
              videoFile
                ? URL.createObjectURL(videoFile)
                : editingTip
                ? getPublicUrl(editingTip.video_key)
                : null
            }
            isUploading={uploading}
            maxSizeMB={50}
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
                  {uploading ? 'Modification...' : 'Modifier le tip'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {uploading ? 'Création...' : 'Créer le tip'}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Liste des tips */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tips existants</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auteur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publication</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vues</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tips.map((tip) => (
                <tr key={tip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{tip.title}</div>
                    {tip.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{tip.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tip.author_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tip.published_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tip.view_count}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleTipActive(tip)}
                      className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
                        tip.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tip.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Actif
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTip(tip)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTip(tip)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tips.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun tip créé pour le moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
