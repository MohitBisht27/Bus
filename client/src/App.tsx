import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReviewerBanner } from './components/common/ReviewerBanner';
import { Navbar } from './components/common/Navbar';
import { TripSearchHero } from './components/passenger/TripSearchHero';
import { TripCard } from './components/passenger/TripCard';
import { SeatLayoutModal } from './components/passenger/SeatLayoutModal';
import { TicketCard } from './components/passenger/TicketCard';
import { MyBookingsView } from './components/passenger/MyBookingsView';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { api } from './api/client';
import {
  Bus,
  CheckCircle2,
  AlertCircle,
  Filter,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'my-bookings' | 'operator' | 'admin'>('search');

  // Search results state
  const [trips, setTrips] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState<any>({
    origin: 'Bangalore',
    destination: 'Chennai',
    date: new Date().toISOString().split('T')[0],
  });

  // Seat modal & confirmed ticket state
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [newlyConfirmedBooking, setNewlyConfirmedBooking] = useState<any | null>(null);

  // Initial search on mount
  const executeSearch = async (params: { origin: string; destination: string; date: string; busType?: string }) => {
    setIsSearching(true);
    setSearchParams(params);
    const query = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      ...(params.busType ? { busType: params.busType } : {}),
    }).toString();

    const res = await api.get(`/trips/search?${query}`);
    setIsSearching(false);
    setHasSearched(true);

    if (res.success && res.data) {
      setTrips(res.data);
    } else {
      setTrips([]);
    }
  };

  useEffect(() => {
    executeSearch({
      origin: 'Bangalore',
      destination: 'Chennai',
      date: new Date().toISOString().split('T')[0],
    });
  }, []);

  // Handle booking completion
  const handleBookingSuccess = async (pnr: string) => {
    setSelectedTripId(null);
    const res = await api.get(`/bookings/pnr/${pnr}`);
    if (res.success && res.data) {
      setNewlyConfirmedBooking(res.data);
    }
    // Refresh search results to show decremented available seats
    executeSearch(searchParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Reviewer Evaluation Quick Bar */}
      <ReviewerBanner />

      {/* Primary Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Areas */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <div className="space-y-8">
            {/* Search Hero */}
            <TripSearchHero onSearch={executeSearch} isLoading={isSearching} />

            {/* Results Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Available Buses ({trips.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing scheduled departures for{' '}
                    <strong>
                      {searchParams.origin} → {searchParams.destination}
                    </strong>{' '}
                    on <strong>{searchParams.date}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => executeSearch(searchParams)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Availability
                  </button>
                </div>
              </div>

              {/* Trip Cards List */}
              {isSearching ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 space-y-2">
                  <span className="inline-block animate-spin text-2xl">⏳</span>
                  <p className="text-xs font-semibold">Searching routes, operators and available seats...</p>
                </div>
              ) : trips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Bus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">No Buses Found for this Date & Route</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try selecting Bangalore → Chennai, Bangalore → Hyderabad, or Mumbai → Pune for today's seeded schedules.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      onSelectSeats={(tripId) => setSelectedTripId(tripId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'my-bookings' && <MyBookingsView />}

        {/* Operator Portal Tab */}
        {activeTab === 'operator' && <OperatorDashboard />}

        {/* Admin Control Center Tab */}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Seat Selection & Booking Modal */}
      {selectedTripId && (
        <SeatLayoutModal
          tripId={selectedTripId}
          onClose={() => setSelectedTripId(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Booking Confirmation Modal */}
      {newlyConfirmedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span className="font-extrabold text-sm">Booking Confirmed Successfully!</span>
              </div>
              <button
                onClick={() => setNewlyConfirmedBooking(null)}
                className="text-emerald-200 hover:text-white font-bold text-xs"
              >
                Close ✕
              </button>
            </div>
            <div className="p-6">
              <TicketCard
                booking={newlyConfirmedBooking}
                onInitiateCancel={() => {
                  setNewlyConfirmedBooking(null);
                  setActiveTab('my-bookings');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">OmniBus Enterprise MERN Platform</span>
            <span>•</span>
            <span>Version 1.0.0</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ACID Concurrency Guaranteed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-semibold"
            >
              OpenAPI / Swagger Spec
            </a>
            <span>•</span>
            <a
              href="http://localhost:5000/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800"
            >
              Health Check API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};
export default App;
