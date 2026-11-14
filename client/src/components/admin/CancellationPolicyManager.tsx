import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldCheck, CheckCircle2, AlertCircle, Save, RefreshCw } from 'lucide-react';

export const CancellationPolicyManager: React.FC = () => {
  const [policy, setPolicy] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [policyName, setPolicyName] = useState('');
  const [policyDesc, setPolicyDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPolicy = async () => {
    setIsLoading(true);
    const res = await api.get('/policies');
    setIsLoading(false);

    if (res.success && res.data) {
      setPolicy(res.data);
      setPolicyName(res.data.name || 'Standard Bus Cancellation Policy');
      setPolicyDesc(res.data.description || 'Tiered rules based on remaining hours');
      setTiers(res.data.tiers || []);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleUpdateTier = (index: number, field: string, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'refundPercentage') {
      updated[index].cancellationFeePercentage = Math.max(0, 100 - Number(value));
    }
    setTiers(updated);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const res = await api.put('/policies', {
      name: policyName,
      description: policyDesc,
      tiers,
    });
    setIsSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Cancellation policy rules updated and persisted!' });
      loadPolicy();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Failed to update policy' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Configurable Cancellation & Refund Rules
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure tiered refund percentages based on the time remaining before trip departure. Changes take effect immediately.
          </p>
        </div>

        <button
          onClick={loadPolicy}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reload policy"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading cancellation policy...</div>
      ) : (
        <form onSubmit={handleSavePolicy} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Policy Title</label>
              <input
                type="text"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description</label>
              <input
                type="text"
                value={policyDesc}
                onChange={(e) => setPolicyDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700"
              />
            </div>
          </div>

          {/* Tiers Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-3 px-3">Tier Condition</th>
                  <th className="py-3 px-3">Min Hours Prior</th>
                  <th className="py-3 px-3">Max Hours Prior</th>
                  <th className="py-3 px-3">Refund (%)</th>
                  <th className="py-3 px-3">Fee (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tiers.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {idx === 0
                        ? '> 24 Hours Prior (Early)'
                        : idx === 1
                        ? '12 - 24 Hours Prior (Mid)'
                        : '< 12 Hours Prior (Late)'}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={tier.minHoursBeforeDeparture}
                        onChange={(e) => handleUpdateTier(idx, 'minHoursBeforeDeparture', Number(e.target.value))}
                        className="w-20 bg-slate-50 border border-slate-200 rounded p-1 font-mono font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {tier.maxHoursBeforeDeparture === null ? '∞ (No limit)' : tier.maxHoursBeforeDeparture}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={tier.refundPercentage}
                          onChange={(e) => handleUpdateTier(idx, 'refundPercentage', Number(e.target.value))}
                          className="w-16 bg-slate-50 border border-slate-200 rounded p-1 font-bold text-emerald-700"
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-600 font-bold">
                      {tier.cancellationFeePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Updating...' : 'Save Cancellation Policy'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
