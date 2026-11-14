import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { TicketCard } from './TicketCard';
import { CancelTicketModal } from './CancelTicketModal';
import { Search, Ticket, Filter, AlertCircle, ArrowRight } from 'lucide-react';

export const MyBookingsView: React.FC = () => {
  const { user } = useAuth();
  const [searchPnr, setSearchPnr] = useState('');
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalPnr, setCancelModalPnr] = useState<string | null>(null);

  // Fetch logged in user bookings
  const loadUserBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    const res = await api.get('/bookings/my-bookings');
    setIsLoading(false);

    if (res.success && res.data) {
      setUserBookings(res.data);
      if (res.data.length > 0 && !activeBooking) {
        setActiveBooking(res.data[0]);
      }
    }
  };

  useEffect(() => {
    loadUserBookings();
  }, [user]);

  // Handle direct PNR search
  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPnr.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    const res = await api.get(`/bookings/pnr/${searchPnr.trim().toUpperCase()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setActiveBooking(res.data);
    } else {
      setErrorMessage(res.error?.message || `No booking found for PNR "${searchPnr}"`);
    }
  };

  const handleCancellationSuccess = () => {
    setCancelModalPnr(null);
    loadUserBookings();
    if (activeBooking) {
      // reload the active booking
      api.get(`/bookings/pnr/${activeBooking.pnr}`).then((res) => {
        if (res.success && res.data) setActiveBooking(res.data);
      });
    }
  };

  const filteredBookings = userBookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.bookingStatus === filterStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search by PNR Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="max-w-xl">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" /> Track & Manage Booking by PNR
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your unique 10-character booking reference code (e.g. <strong>BUS-DEMO1</strong>) to view, print, or cancel your ticket.
          </p>

          <form onSubmit={handlePnrSearch} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter PNR (e.g. BUS-DEMO1)"
                value={searchPnr}
                onChange={(e) => setSearchPnr(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Lookup
            </button>
          </form>

          {errorMessage && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: My Bookings List (Left) and Active Ticket View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Bookings History List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              My Booking History ({filteredBookings.length})
            </h3>
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterStatus === status
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isLoading && userBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
              No {filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} bookings found. Search and book a bus above to get your first ticket!
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const isSelected = activeBooking?.pnr === b.pnr;
                const isCancelled = b.bookingStatus === 'CANCELLED';

                return (
                  <div
                    key={b.pnr}
                    onClick={() => setActiveBooking(b)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-sm text-slate-900">{b.pnr}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {b.boardingPoint?.stopName} → {b.droppingPoint?.stopName}
                      </span>
                      <span className="font-bold text-slate-900">₹{b.totalFare}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Seats: {b.seats?.map((s: any) => s.seatNumber).join(', ')}</span>
                      <span>{new Date(b.boardingPoint?.time).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: E-Ticket Display */}
        <div className="lg:col-span-7">
          {activeBooking ? (
            <TicketCard
              booking={activeBooking}
              onInitiateCancel={(pnr) => setCancelModalPnr(pnr)}
            />
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
              Select a booking from the left or enter a PNR above to view ticket details.
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalPnr && (
        <CancelTicketModal
          pnr={cancelModalPnr}
          onClose={() => setCancelModalPnr(null)}
          onSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
};
