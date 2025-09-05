'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Eye, EyeOff } from 'lucide-react';

interface IdentityDocumentsViewerProps {
  frontUrl: string;
  backUrl: string;
  userName: string;
  className?: string;
}

interface ImageViewerProps {
  src: string;
  alt: string;
  title: string;
}

function ImageViewer({ src, alt, title }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isBlurred, setIsBlurred] = useState(true);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => setZoom(1);
  
  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${alt.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  return (
    <>
      {/* Miniature cliquable */}
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isBlurred ? 'blur-sm' : ''
            }`}
          />
          
          {/* Overlay avec info */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          
          {/* Badge blur */}
          {isBlurred && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              Confidentiel
            </div>
          )}
        </div>
        
        <h3 className="mt-2 text-sm font-medium text-gray-900 text-center">{title}</h3>
        
        {/* Toggle blur pour la miniature */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsBlurred(!isBlurred);
          }}
          className="absolute top-2 left-2 bg-white bg-opacity-90 hover:bg-white text-gray-700 p-1.5 rounded transition-colors"
          title={isBlurred ? 'Afficher le document' : 'Masquer le document'}
        >
          {isBlurred ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Modal de visualisation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{alt}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Controls de zoom */}
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-[4rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Zoomer"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                
                {/* Bouton téléchargement */}
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {/* Bouton fermer */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="relative overflow-auto max-h-[70vh] bg-gray-50">
              <div className="flex items-center justify-center min-h-[400px] p-4">
                <img
                  src={src}
                  alt={alt}
                  className="max-w-none transition-transform duration-200 select-none"
                  style={{ 
                    transform: `scale(${zoom})`,
                    cursor: zoom > 1 ? 'grab' : 'default'
                  }}
                  onClick={resetZoom}
                  onDoubleClick={() => setZoom(zoom === 1 ? 2 : 1)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function IdentityDocumentsViewer({ 
  frontUrl, 
  backUrl, 
  userName, 
  className = '' 
}: IdentityDocumentsViewerProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          Pièces d'identité - {userName}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Vérifiez que le nom complet correspond aux informations saisies
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageViewer
          src={frontUrl}
          alt={`Pièce d'identité recto - ${userName}`}
          title="Recto"
        />
        
        <ImageViewer
          src={backUrl}
          alt={`Pièce d'identité verso - ${userName}`}
          title="Verso"
        />
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-amber-900 mb-2">Points de vérification :</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Vérifier que le nom complet correspond exactement</li>
          <li>• S'assurer que la pièce d'identité est lisible et non expirée</li>
          <li>• Contrôler la cohérence des informations (âge, etc.)</li>
          <li>• Vérifier l'authenticité du document (pas de montage visible)</li>
        </ul>
      </div>
    </div>
  );
}