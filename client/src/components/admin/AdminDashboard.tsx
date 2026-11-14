import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { FleetManager } from './FleetManager';
import { CancellationPolicyManager } from './CancellationPolicyManager';
import { AuditTrailViewer } from './AuditTrailViewer';
import { OperatorDashboard } from '../operator/OperatorDashboard';
import {
  ShieldCheck,
  Bus,
  MapPin,
  TrendingUp,
  History,
  Settings,
  BarChart3,
  Users,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fleet' | 'occupancy' | 'policy' | 'audit'>('fleet');
  const [overviewKPIs, setOverviewKPIs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKPIs() {
      setIsLoading(true);
      const res = await api.get('/reports/dashboard-overview');
      setIsLoading(false);
      if (res.success && res.data) {
        setOverviewKPIs(res.data);
      }
    }
    loadKPIs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 rounded-2xl text-white p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-200 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-500/30">
            System Administration Center
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            OmniBus Enterprise Operations & Fleet Control
          </h1>
          <p className="text-xs text-emerald-100 mt-1">
            Logged in as <strong>{user?.name || 'Administrator'} (ADMIN)</strong>. Full operational authority across fleet, routes, policies, and audit logs.
          </p>
        </div>
      </div>

      {/* System KPI Summary */}
      {overviewKPIs && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Operators
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
              {overviewKPIs.totalOperators}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bus Fleet
            </span>
            <span className="text-xl font-extrabold text-indigo-600 mt-0.5 block">
              {overviewKPIs.totalBuses}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Scheduled Trips
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
              {overviewKPIs.totalTrips}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Confirmed Bookings
            </span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
              {overviewKPIs.confirmedBookings}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              System Gross Sales
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
              ₹{overviewKPIs.grossRevenue?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Admin sections */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'fleet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Fleet & Route Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('occupancy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'occupancy'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Occupancy & Manifests</span>
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'policy'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cancellation Policy Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail Viewer</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'fleet' && <FleetManager />}
        {activeTab === 'occupancy' && <OperatorDashboard />}
        {activeTab === 'policy' && <CancellationPolicyManager />}
        {activeTab === 'audit' && <AuditTrailViewer />}
      </div>
    </div>
  );
};
