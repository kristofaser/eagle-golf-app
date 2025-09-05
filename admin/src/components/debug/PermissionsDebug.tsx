'use client';

import { useState, useEffect } from 'react';

interface PermissionsDebugProps {
  canValidate: boolean;
  requestStatus: string;
}

export default function PermissionsDebug({ canValidate, requestStatus }: PermissionsDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Récupérer les infos utilisateur côté client
    fetch('/api/debug/permissions')
      .then(res => res.json())
      .then(data => setDebugInfo(data))
      .catch(err => console.error('Debug permissions error:', err));
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm text-xs shadow-lg z-50">
      <h4 className="font-bold text-yellow-900 mb-2">🐛 Debug Permissions</h4>
      <div className="space-y-1 text-yellow-800">
        <p><strong>canValidate:</strong> {canValidate ? '✅ true' : '❌ false'}</p>
        <p><strong>requestStatus:</strong> {requestStatus}</p>
        
        {debugInfo && (
          <>
            <p><strong>user email:</strong> {debugInfo.userEmail}</p>
            <p><strong>admin found:</strong> {debugInfo.adminFound ? '✅' : '❌'}</p>
            {debugInfo.adminProfile && (
              <>
                <p><strong>role:</strong> {debugInfo.adminProfile.role}</p>
                <p><strong>permissions:</strong></p>
                <ul className="ml-2">
                  {debugInfo.adminProfile.permissions?.map((perm: string, i: number) => (
                    <li key={i}>• {perm}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        
        <p className="pt-2 border-t border-yellow-300">
          <strong>Buttons should show:</strong> {canValidate && requestStatus === 'pending' ? '✅ YES' : '❌ NO'}
        </p>
      </div>
    </div>
  );
}