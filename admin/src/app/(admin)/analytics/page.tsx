'use client';

import { TrendingUp, Users, Calendar, DollarSign, Activity, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visualisez les performances et les statistiques de la plateforme
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex justify-between">
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-lg">
            30 derniers jours
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            90 derniers jours
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            12 derniers mois
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Personnalisé
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Utilisateurs actifs</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">2,456</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+23%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Réservations</span>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">856</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+15%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Revenus</span>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">48,560€</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+28%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Taux de conversion</span>
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">4.8%</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+0.5%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Évolution des revenus</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Graphique des revenus]
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Réservations par jour</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Graphique des réservations]
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pros */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Professionnels</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Marie Martin</span>
              <span className="text-sm font-medium text-gray-900">45 cours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sophie Leroy</span>
              <span className="text-sm font-medium text-gray-900">38 cours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Thomas Petit</span>
              <span className="text-sm font-medium text-gray-900">32 cours</span>
            </div>
          </div>
        </div>

        {/* Popular Courses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcours populaires</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Golf National</span>
              <span className="text-sm font-medium text-gray-900">156 réservations</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Golf de Saint-Cloud</span>
              <span className="text-sm font-medium text-gray-900">142 réservations</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Golf de Fontainebleau</span>
              <span className="text-sm font-medium text-gray-900">98 réservations</span>
            </div>
          </div>
        </div>

        {/* User Demographics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition utilisateurs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amateurs</span>
              <span className="text-sm font-medium text-gray-900">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Professionnels</span>
              <span className="text-sm font-medium text-gray-900">32%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taux d'activation</span>
              <span className="text-sm font-medium text-gray-900">45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}