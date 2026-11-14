import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Search,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface PassengerManifestModalProps {
  tripId: string;
  onClose: () => void;
}

export const PassengerManifestModal: React.FC<PassengerManifestModalProps> = ({
  tripId,
  onClose,
}) => {
  const [manifestData, setManifestData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  const loadManifest = async () => {
    setIsLoading(true);
    const res = await api.get(`/reports/trips/${tripId}/manifest`);
    setIsLoading(false);

    if (res.success && res.data) {
      setManifestData(res.data);
    }
  };

  useEffect(() => {
    loadManifest();
  }, [tripId]);

  // Handle passenger check-in
  const handleCheckIn = async (pnr: string) => {
    setCheckInLoading(pnr);
    const res = await api.patch(`/bookings/pnr/${pnr}/check-in`);
    setCheckInLoading(null);

    if (res.success) {
      loadManifest();
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!manifestData?.passengers) return;
    const headers = [
      'Seat Number',
      'PNR',
      'Passenger Name',
      'Age',
      'Gender',
      'Phone',
      'Boarding Stop',
      'Dropping Stop',
      'Fare (INR)',
      'Booking Status',
      'Checked In',
    ];

    const rows = manifestData.passengers.map((p: any) => [
      p.seatNumber,
      p.pnr,
      `"${p.passengerName}"`,
      p.passengerAge,
      p.passengerGender,
      p.contactPhone,
      `"${p.boardingStop}"`,
      `"${p.droppingStop}"`,
      p.fare,
      p.bookingStatus,
      p.checkedIn ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Passenger_Manifest_${manifestData.trip.tripCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPassengers = (manifestData?.passengers || []).filter((p: any) => {
    const matchesSearch =
      p.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.seatNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'CONFIRMED') return p.bookingStatus === 'CONFIRMED';
    if (statusFilter === 'CANCELLED') return p.bookingStatus === 'CANCELLED';
    if (statusFilter === 'CHECKED_IN') return p.checkedIn === true;

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] printable-area">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold tracking-wide">
                Official Passenger Boarding Manifest
              </h2>
              {manifestData && (
                <span className="font-mono text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                  {manifestData.trip.tripCode}
                </span>
              )}
            </div>
            {manifestData && (
              <p className="text-xs text-slate-400 mt-0.5">
                {manifestData.trip.operator?.name} • Route:{' '}
                {manifestData.trip.route?.originCity} → {manifestData.trip.route?.destinationCity} (
                {new Date(manifestData.trip.departureTime).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors no-print"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reconciled Summary Metric Cards */}
        {manifestData && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Capacity</span>
              <span className="text-lg font-extrabold text-slate-800">
                {manifestData.summary.totalSeats}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Confirmed Passengers</span>
              <span className="text-lg font-extrabold text-indigo-600">
                {manifestData.summary.confirmedSeats}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupancy Rate</span>
              <span className="text-lg font-extrabold text-emerald-600">
                {manifestData.summary.occupancyPercentage}%
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Checked In</span>
              <span className="text-lg font-extrabold text-amber-600">
                {manifestData.summary.checkedInSeats} / {manifestData.summary.confirmedSeats}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cancelled Seats</span>
              <span className="text-lg font-extrabold text-rose-500">
                {manifestData.summary.cancelledSeats}
              </span>
            </div>
          </div>
        )}

        {/* Filter and Action Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Name, PNR or Seat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            {(['ALL', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Export & Print */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Passenger Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading passenger manifest...</div>
          ) : filteredPassengers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No passengers matching current criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Seat</th>
                    <th className="py-2.5 px-3">PNR</th>
                    <th className="py-2.5 px-3">Passenger</th>
                    <th className="py-2.5 px-3">Gender/Age</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Boarding Stop</th>
                    <th className="py-2.5 px-3">Dropping Stop</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right no-print">Check-In Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPassengers.map((row: any, idx: number) => {
                    const isCancelled = row.bookingStatus === 'CANCELLED';
                    return (
                      <tr
                        key={`manifest-row-${idx}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          isCancelled ? 'bg-rose-50/40 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {row.seatNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">{row.pnr}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.passengerName}</td>
                        <td className="py-2.5 px-3">
                          {row.passengerGender} ({row.passengerAge}y)
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">{row.contactPhone}</td>
                        <td className="py-2.5 px-3 text-slate-800">{row.boardingStop}</td>
                        <td className="py-2.5 px-3 text-slate-800">{row.droppingStop}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isCancelled
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {row.bookingStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right no-print">
                          {isCancelled ? (
                            <span className="text-[11px] text-rose-500 italic">Seat Released</span>
                          ) : row.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" /> Checked In
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(row.pnr)}
                              disabled={checkInLoading === row.pnr}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
                            >
                              {checkInLoading === row.pnr ? '...' : 'Mark Boarded'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
