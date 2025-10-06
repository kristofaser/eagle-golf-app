import Link from 'next/link';
import { Crown, Video, FileText, Newspaper, Users, TrendingUp, Euro, Clock, Package, Lightbulb, MapPin } from 'lucide-react';

export default function PremiumPage() {
  return (
    <div>
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

      {/* Content Types - Gestion Vidéos Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Link href="/premium/in-the-bag" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">In the Bag</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Vidéos des pros expliquant leur équipement</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gérer les vidéos →</span>
          </div>
        </Link>

        <Link href="/premium/tips" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tips de la Semaine</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Vidéos courtes de conseils golf (30s-2min)</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gérer les tips →</span>
          </div>
        </Link>

        <Link href="/premium/pro-holes" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Parcours 3 Trous</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Vidéos des pros jouant 3 trous avec scores</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gérer les vidéos →</span>
          </div>
        </Link>
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

    </div>
  );
}