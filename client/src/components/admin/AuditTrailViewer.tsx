import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { History, Search, RefreshCw, Eye, ShieldAlert } from 'lucide-react';

export const AuditTrailViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    const query = selectedAction ? `?action=${selectedAction}` : '';
    const res = await api.get(`/audit-logs${query}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setLogs(res.data);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction]);

  const actionColors: Record<string, string> = {
    BOOKING_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    BOOKING_CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
    SEATS_LOCKED: 'bg-amber-100 text-amber-800 border-amber-300',
    PASSENGER_CHECKIN: 'bg-blue-100 text-blue-800 border-blue-300',
    USER_LOGIN: 'bg-slate-100 text-slate-800 border-slate-300',
    TRIP_CREATED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    CANCELLATION_POLICY_UPDATED: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> Immutable Business Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped audit records for all material system events (seat locks, confirmations, cancellations, check-ins).
          </p>
        </div>

        {/* Filter and Reload */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="">All Business Actions</option>
            <option value="BOOKING_CREATED">BOOKING_CREATED</option>
            <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
            <option value="SEATS_LOCKED">SEATS_LOCKED</option>
            <option value="PASSENGER_CHECKIN">PASSENGER_CHECKIN</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="TRIP_CREATED">TRIP_CREATED</option>
            <option value="CANCELLATION_POLICY_UPDATED">CANCELLATION_POLICY_UPDATED</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <span className="inline-block animate-spin mr-2">⏳</span> Loading audit trail records...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No audit records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Actor / User</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log._id;
                const badgeStyle = actionColors[log.action] || 'bg-slate-100 text-slate-700';

                return (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeStyle}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{log.userRole}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                        {log.entityType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition-colors"
                        >
                          {isExpanded ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="p-3 text-[11px] font-mono">
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-[10px]">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
