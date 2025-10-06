'use client';

import { MessageSquare, Clock, CheckCircle, AlertCircle, XCircle, Send } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);

  // Données temporaires pour la démonstration
  const tickets = [
    {
      id: 1,
      user: 'Jean Dupont',
      subject: 'Problème de paiement',
      message: 'Je n\'arrive pas à effectuer mon paiement pour la réservation...',
      status: 'ouvert',
      priority: 'haute',
      date: '2024-02-15 10:30',
      responses: 2
    },
    {
      id: 2,
      user: 'Marie Martin',
      subject: 'Question sur les disponibilités',
      message: 'Comment puis-je modifier mes créneaux de disponibilité ?',
      status: 'en cours',
      priority: 'moyenne',
      date: '2024-02-15 09:15',
      responses: 1
    },
    {
      id: 3,
      user: 'Pierre Bernard',
      subject: 'Annulation de réservation',
      message: 'J\'aimerais annuler ma réservation du 20 février...',
      status: 'résolu',
      priority: 'basse',
      date: '2024-02-14 16:45',
      responses: 3
    },
    {
      id: 4,
      user: 'Sophie Leroy',
      subject: 'Problème de connexion',
      message: 'Je ne peux plus me connecter à mon compte professionnel...',
      status: 'ouvert',
      priority: 'haute',
      date: '2024-02-15 11:00',
      responses: 0
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ouvert':
        return 'bg-red-100 text-red-800';
      case 'en cours':
        return 'bg-yellow-100 text-yellow-800';
      case 'résolu':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute':
        return 'text-red-600';
      case 'moyenne':
        return 'text-yellow-600';
      case 'basse':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tickets ouverts</p>
              <p className="text-2xl font-bold text-red-600">12</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-2xl font-bold text-yellow-600">8</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Résolus (7j)</p>
              <p className="text-2xl font-bold text-green-600">45</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Temps moyen</p>
              <p className="text-2xl font-bold text-gray-900">2.5h</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Column */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Tickets récents</h2>
            </div>
            <div className="divide-y">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedTicket === ticket.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                        <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ticket.user}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{ticket.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{ticket.date}</span>
                    <div className="flex items-center text-xs text-gray-500">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {ticket.responses} réponses
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="bg-white rounded-lg shadow">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {tickets.find(t => t.id === selectedTicket)?.subject}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  De: {tickets.find(t => t.id === selectedTicket)?.user}
                </p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {tickets.find(t => t.id === selectedTicket)?.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {tickets.find(t => t.id === selectedTicket)?.date}
                    </p>
                  </div>
                  {/* Exemple de réponse */}
                  <div className="bg-blue-50 p-3 rounded-lg ml-8">
                    <p className="text-sm text-gray-700">
                      Bonjour, nous avons bien reçu votre demande. Un membre de notre équipe va vous répondre dans les plus brefs délais.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Support - Il y a 2 heures</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tapez votre réponse..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                <p>Sélectionnez un ticket pour voir les détails</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}