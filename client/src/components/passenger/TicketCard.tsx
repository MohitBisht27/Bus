import React from 'react';
import {
  Ticket,
  Printer,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  User,
  ShieldCheck,
} from 'lucide-react';

interface TicketCardProps {
  booking: any;
  onInitiateCancel?: (pnr: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ booking, onInitiateCancel }) => {
  if (!booking) return null;

  const isCancelled = booking.bookingStatus === 'CANCELLED';
  const trip = booking.tripId;
  const departureDate = new Date(trip?.departureTime || booking.boardingPoint?.time);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden max-w-2xl mx-auto printable-area">
      {/* Ticket Header Banner */}
      <div
        className={`px-6 py-4 flex items-center justify-between text-white ${
          isCancelled ? 'bg-rose-700' : 'bg-gradient-to-r from-indigo-700 to-indigo-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-6 h-6 text-indigo-200" />
          <div>
            <h3 className="font-extrabold text-base tracking-wide">
              {isCancelled ? 'CANCELLED E-TICKET' : 'OFFICIAL BUS E-TICKET'}
            </h3>
            <p className="text-xs text-indigo-200">
              {trip?.operatorId?.name || 'Intercity Bus Service'}
            </p>
          </div>
        </div>

        {/* PNR Badge */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-indigo-200 block">PNR Number</span>
          <span className="font-mono text-xl font-black bg-white/10 px-3 py-1 rounded-lg border border-white/20 tracking-wider">
            {booking.pnr}
          </span>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-6 space-y-5">
        {/* Route & Schedule Row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Origin / Boarding
            </span>
            <div className="text-lg font-extrabold text-slate-800">
              {booking.boardingPoint?.stopName}
            </div>
            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(booking.boardingPoint?.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              ({departureDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Destination / Drop
            </span>
            <div className="text-lg font-extrabold text-slate-800">
              {booking.droppingPoint?.stopName}
            </div>
            <div className="text-xs text-rose-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(booking.droppingPoint?.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Bus & Fleet details */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium block text-[10px] uppercase">Bus Vehicle</span>
            <span className="font-bold text-slate-800">
              {trip?.busId?.registrationNumber || 'KA-01-EQ-9988'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px] uppercase">Bus Model</span>
            <span className="font-bold text-slate-800 truncate block">
              {trip?.busId?.busModel || 'Multi-Axle AC'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px] uppercase">Status</span>
            <span
              className={`font-bold inline-flex items-center gap-1 ${
                isCancelled ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isCancelled ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {booking.bookingStatus}
            </span>
          </div>
        </div>

        {/* Passenger Manifest Breakdown */}
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Passengers on this PNR ({booking.seats?.length})
          </span>
          <div className="space-y-2">
            {booking.seats?.map((seat: any, idx: number) => (
              <div
                key={`seat-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white shadow-xs text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center">
                    {seat.seatNumber}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{seat.passengerName}</span>
                    <span className="text-slate-400 text-[10px]">
                      {seat.passengerGender} • {seat.passengerAge} yrs • {seat.seatType}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">₹{seat.fare}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Details (if cancelled) */}
        {isCancelled && booking.cancellationDetails && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1 text-rose-700">
              <AlertTriangle className="w-4 h-4" /> Ticket Cancelled on{' '}
              {new Date(booking.cancellationDetails.cancelledAt).toLocaleString()}
            </div>
            <div className="flex justify-between pt-1">
              <span>Simulated Refund Status:</span>
              <span className="font-bold text-emerald-700">
                {booking.cancellationDetails.refundStatus} (₹
                {booking.cancellationDetails.refundAmount})
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Cancellation Fee Retained:</span>
              <span>₹{booking.cancellationDetails.cancellationFee}</span>
            </div>
          </div>
        )}

        {/* Total & QR Verification */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 rounded-lg p-1.5 flex flex-col items-center justify-center text-white text-[8px] font-mono shadow-xs">
              <QrCode className="w-7 h-7 mb-0.5" />
              <span>VERIFIED</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="block font-semibold text-slate-700">Scan at Bus Boarding</span>
              <span>Primary Passenger: {booking.passenger?.name}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Paid</span>
            <span className="text-xl font-extrabold text-slate-900">
              ₹{booking.totalFare?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons (Print / Cancel) */}
        <div className="pt-2 flex items-center justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>

          {!isCancelled && onInitiateCancel && (
            <button
              onClick={() => onInitiateCancel(booking.pnr)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
