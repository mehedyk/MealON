// ============================================
// TEMPORARY DEBUG PANEL
// Add this to your App.jsx to see what's happening
// Remove after debugging is complete
// ============================================

import React from 'react';
import { useAuth } from './context/AuthContext';

const DebugPanel = () => {
  const { user, member, mess, loading, error, reloadMemberData } = useAuth();

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-2xl text-xs max-w-md z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🐛 Debug Panel</h3>
        <button 
          onClick={reloadMemberData}
          className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
        >
          Reload Data
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error || '✅ None'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Not logged in'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || '❌ None'}
        </div>
        
        <div>
          <strong>Member:</strong> {member ? `✅ ${member.name} (ID: ${member.id})` : '❌ No member data'}
        </div>
        
        <div>
          <strong>Mess:</strong> {mess ? `✅ ${mess.name} (Code: ${mess.mess_code})` : '❌ No mess data'}
        </div>
        
        <div>
          <strong>Mess ID:</strong> {mess?.id || '❌ None'}
        </div>

        {user && (
          <details className="mt-2">
            <summary className="cursor-pointer">User Metadata</summary>
            <pre className="mt-1 text-xs overflow-auto max-h-32">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </details>
        )}

        {member && (
          <details className="mt-2">
            <summary className="cursor-pointer">Member Data</summary>
            <pre className="mt-1 text-xs overflow-auto max-h-32">
              {JSON.stringify(member, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;

// ============================================
// HOW TO USE:
// ============================================
// 1. Save this as src/components/DebugPanel.jsx
// 2. In App.jsx, import it:
//    import DebugPanel from './components/DebugPanel';
// 3. Add it before the closing div in App.jsx:
//    return (
//      <div>
//        {/* ... your app content ... */}
//        <DebugPanel />  {/* <-- Add this */}
//      </div>
//    );
// 4. Check the panel in bottom-right corner
// 5. Click "Reload Data" if state looks wrong
