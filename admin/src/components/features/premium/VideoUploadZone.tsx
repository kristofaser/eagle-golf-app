'use client';

import { useRef, useState } from 'react';
import { Upload, Video, X } from 'lucide-react';

interface VideoUploadZoneProps {
  onVideoSelect: (file: File) => void;
  currentVideoUrl?: string | null;
  isUploading?: boolean;
  maxSizeMB?: number;
}

export default function VideoUploadZone({
  onVideoSelect,
  currentVideoUrl,
  isUploading = false,
  maxSizeMB = 100,
}: VideoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Vérifier le type
    if (!file.type.startsWith('video/')) {
      return 'Veuillez sélectionner un fichier vidéo valide';
    }

    // Vérifier la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `La taille de la vidéo ne doit pas dépasser ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onVideoSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-all cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Upload en cours...</p>
            <p className="text-xs text-gray-500 mt-1">Veuillez patienter</p>
          </div>
        ) : currentVideoUrl ? (
          <div className="space-y-3">
            <Video className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Vidéo uploadée avec succès</p>
              <p className="text-xs text-gray-500 mt-1">Cliquer pour remplacer</p>
            </div>
            {/* Prévisualisation */}
            <video
              src={currentVideoUrl}
              controls
              className="w-full max-w-md h-48 mx-auto rounded-lg object-cover bg-black"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Glisser-déposer une vidéo ou cliquer pour sélectionner
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, MOV, AVI jusqu'à {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
