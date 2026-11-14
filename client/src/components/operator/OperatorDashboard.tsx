import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PassengerManifestModal } from './PassengerManifestModal';
import {
  Users,
  Bus,
  Calendar,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [occupancyReport, setOccupancyReport] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    // Fetch occupancy summary for operator or system-wide
    const res = await api.get('/reports/occupancy');
    setIsLoading(false);

    if (res.success && res.data) {
      setOccupancyReport(res.data);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const overview = occupancyReport?.overview;
  const trips = occupancyReport?.trips || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Operator Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl text-white p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-amber-200 bg-amber-900/40 px-2.5 py-1 rounded-md border border-amber-500/30">
            Operator Management View
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            Trip Schedules, Seat Occupancy & Passenger Manifests
          </h1>
          <p className="text-xs text-amber-100 mt-1">
            Logged in as <strong>{user?.name || 'Karnataka Royal Lines Staff'}</strong>. Real-time passenger check-in and reconciled seat manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
          >
            Refresh Live Feed
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Trips
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {overview.totalTrips}
            </span>
            <span className="text-[11px] text-slate-500">Scheduled in current period</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Average Fleet Occupancy
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">
                {overview.averageOccupancyRate}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({overview.totalSeatsBooked} / {overview.totalSeatsOffered} seats)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${overview.averageOccupancyRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Gross Revenue
            </span>
            <span className="text-2xl font-black text-indigo-700 mt-1 block">
              ₹{overview.totalGrossRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">From confirmed seat sales</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Net Realized Revenue
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              ₹{overview.netRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-500">
              ₹{overview.totalRefunds.toLocaleString()} refunded on cancellations
            </span>
          </div>
        </div>
      )}

      {/* Trips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Scheduled Departures & Occupancy Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Select any trip to view or print the official boarding manifest and mark passengers checked-in.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="inline-block animate-spin mr-2">⏳</span> Loading operator trip metrics...
          </div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No trips found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Bus Vehicle</th>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4">Seat Occupancy</th>
                  <th className="py-3 px-4">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {trips.map((t: any) => {
                  return (
                    <tr key={t.tripId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.tripCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.operatorName}</td>
                      <td className="py-3 px-4 text-slate-800">{t.routeName}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {t.busRegistration || 'KA-01-EQ-9988'}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(t.departureTime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {t.confirmedSeats} / {t.capacity}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              t.occupancyRate > 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.occupancyRate > 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.occupancyRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{t.netRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTripId(t.tripId)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Manifest
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Passenger Manifest Modal */}
      {selectedTripId && (
        <PassengerManifestModal
          tripId={selectedTripId}
          onClose={() => setSelectedTripId(null)}
        />
      )}
    </div>
  );
};
