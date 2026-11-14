import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { X, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface CancelTicketModalProps {
  pnr: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  pnr,
  onClose,
  onSuccess,
}) => {
  const [preview, setPreview] = useState<any>(null);
  const [reason, setReason] = useState('Change of travel plans');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      setIsLoading(true);
      const res = await api.get(`/bookings/pnr/${pnr}/cancel-preview`);
      setIsLoading(false);

      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to fetch cancellation preview');
      }
    }
    fetchPreview();
  }, [pnr]);

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await api.post(`/bookings/pnr/${pnr}/cancel`, { reason });
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-200" />
            <h3 className="font-bold text-base">Cancel Ticket & Refund Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <span className="inline-block animate-spin mr-2">⏳</span> Evaluating cancellation policy rules...
            </div>
          ) : preview ? (
            <div className="space-y-4 text-xs">
              {/* PNR and timing */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium block">Ticket PNR</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{pnr}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium block">Time Until Departure</span>
                  <span className="font-bold text-indigo-700">{preview.hoursBeforeDeparture} hours</span>
                </div>
              </div>

              {/* Applied Rule Breakdown */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-1">
                <span className="font-bold block text-[11px] text-amber-800 uppercase tracking-wider">
                  Active Policy Tier: {preview.policyName}
                </span>
                <p className="text-xs font-semibold">{preview.appliedTier?.description}</p>
                <div className="flex items-center justify-between pt-1 font-mono">
                  <span>Refund Rate:</span>
                  <span className="font-bold text-emerald-700">{preview.refundPercentage}%</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Original Total Fare:</span>
                  <span className="font-semibold text-slate-800">₹{preview.totalFare}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cancellation Fee ({100 - preview.refundPercentage}%):</span>
                  <span className="font-semibold text-rose-600">-₹{preview.cancellationFee}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Simulated Refund Amount:</span>
                  <span className="text-emerald-600">₹{preview.refundAmount}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  *Seats will be released immediately to AVAILABLE inventory upon cancellation.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Reason for Cancellation:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="Change of travel plans">Change of travel plans</option>
                  <option value="Booked by mistake">Booked by mistake</option>
                  <option value="Emergency or illness">Emergency or illness</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {/* Confirm CTA */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-colors"
                >
                  Keep Ticket
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin mr-1">⏳</span>
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Confirm Cancellation (Refund ₹{preview.refundAmount})
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
