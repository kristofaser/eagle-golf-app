import { Crown, Video, FileText, Newspaper, Users, TrendingUp, Euro, Clock } from 'lucide-react';

export default function PremiumPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonnements Premium</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les abonnements premium et le contenu exclusif (vidéos, reportages, actualités)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Abonnés actifs</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenus mensuels</p>
              <p className="text-2xl font-bold text-gray-900">0€</p>
            </div>
            <Euro className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contenus publiés</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Video className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Taux de rétention</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Content Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-4">
            <Video className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Vidéos</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
          <p className="text-sm text-gray-500">Contenus vidéo disponibles</p>
          <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Gérer les vidéos
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Reportages</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
          <p className="text-sm text-gray-500">Reportages exclusifs</p>
          <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Gérer les reportages
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Actualités</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">0</p>
          <p className="text-sm text-gray-500">Articles d'actualité</p>
          <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Gérer les actualités
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <Crown className="h-5 w-5" />
          <span>Ajouter du contenu</span>
        </button>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Abonnés Premium récents</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun abonné premium pour le moment</p>
          <p className="text-sm mt-2">Les utilisateurs abonnés apparaîtront ici</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">À propos de Premium</h3>
          <p className="text-sm text-gray-600">
            L'abonnement Premium donne accès à du contenu exclusif : vidéos de formation, 
            reportages sur les tournois, actualités du golf et conseils de professionnels.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Types de contenu</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Vidéos de formation et masterclass</li>
            <li>• Reportages exclusifs sur les tournois</li>
            <li>• Actualités et analyses du monde du golf</li>
            <li>• Interviews de professionnels</li>
          </ul>
        </div>
      </div>
    </div>
  );
}