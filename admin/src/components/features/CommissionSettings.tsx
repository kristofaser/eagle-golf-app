'use client';

import { useState, useEffect } from 'react';
import { Euro, Save } from 'lucide-react';
import { getCurrentCommission, updateCommission } from '@/app/(admin)/admin/users/commission-actions';

interface CommissionSettingsProps {
  canEdit: boolean;
}

export default function CommissionSettings({ canEdit }: CommissionSettingsProps) {
  const [commission, setCommission] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inputValue, setInputValue] = useState<string>('20');

  useEffect(() => {
    loadCurrentCommission();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadCurrentCommission = async () => {
    const result = await getCurrentCommission();
    if (result.success && result.data) {
      setCommission(result.data);
      setInputValue(result.data.toString());
    } else if (result.message) {
      setMessage({ type: 'error', text: result.message });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const newCommission = parseFloat(inputValue);

    if (isNaN(newCommission) || newCommission < 0 || newCommission > 100) {
      setMessage({ type: 'error', text: 'La commission doit être entre 0 et 100%' });
      return;
    }

    setSaving(true);
    const result = await updateCommission(newCommission);

    if (result.success) {
      setCommission(newCommission);
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Euro className="h-6 w-6 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900">Commission Eagle</h2>
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={saving || inputValue === commission.toString()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-2">
            Pourcentage de commission sur les réservations
          </label>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="commission"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
              <span className="text-gray-500">%</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">{commission}%</div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          <p>Cette commission s'applique à toutes les nouvelles réservations.</p>
          <p className="mt-1">Date d'effet : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
}
