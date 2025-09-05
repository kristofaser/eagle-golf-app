import { Plane, MapPin, Calendar, Users, Euro, TrendingUp } from 'lucide-react';

export default function VoyagesPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Voyages Golf</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez les voyages de golf organisés avec professionnels et amateurs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Voyages actifs</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Plane className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Destinations</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">CA généré</p>
              <p className="text-2xl font-bold text-gray-900">0€</p>
            </div>
            <Euro className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <Plane className="h-5 w-5" />
          <span>Créer un voyage</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Voyages organisés</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Plane className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun voyage organisé pour le moment</p>
          <p className="text-sm mt-2">Créez votre premier voyage de golf pour commencer</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">À propos des voyages</h3>
          <p className="text-sm text-gray-600">
            Cette section permet d'organiser et de gérer des voyages de golf combinant professionnels et amateurs. 
            Les participants peuvent réserver des séjours incluant hébergement, parcours et leçons avec des pros.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Prochaines fonctionnalités</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Création de voyages personnalisés</li>
            <li>• Gestion des réservations et paiements</li>
            <li>• Système de notation des voyages</li>
            <li>• Partenariats avec hôtels et golfs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}