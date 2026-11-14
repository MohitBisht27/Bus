import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Key, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ReviewerBanner: React.FC = () => {
  const { user, quickSwitch, logout } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4 shadow-sm no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
            <ShieldCheck className="w-3.5 h-3.5" /> Reviewer Evaluation Mode
          </span>
          <span className="hidden sm:inline text-slate-400">
            Current Identity: <strong className="text-white">{user ? `${user.name} (${user.role})` : 'Guest / Not Logged In'}</strong>
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <span className="text-slate-400 hidden md:inline">Quick Role Switch:</span>
          
          <button
            onClick={() => quickSwitch('PASSENGER')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
              user?.role === 'PASSENGER'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Login as Passenger: passenger@example.com"
          >
            <UserCheck className="w-3 h-3" /> Passenger
          </button>

          <button
            onClick={() => quickSwitch('OPERATOR')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
              user?.role === 'OPERATOR'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Login as Operator: operator@krl.com"
          >
            <Key className="w-3 h-3" /> Operator (KRL)
          </button>

          <button
            onClick={() => quickSwitch('ADMIN')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ${
              user?.role === 'ADMIN'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Login as Admin: admin@omnibus.com"
          >
            <ShieldCheck className="w-3 h-3" /> System Admin
          </button>

          {user && (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 ml-1 px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
