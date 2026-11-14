import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Search, MapPin, Calendar, Bus, ArrowRightLeft } from 'lucide-react';

interface TripSearchHeroProps {
  onSearch: (params: { origin: string; destination: string; date: string; busType?: string }) => void;
  isLoading: boolean;
}

export const TripSearchHero: React.FC<TripSearchHeroProps> = ({ onSearch, isLoading }) => {
  const [cities, setCities] = useState<{ origins: string[]; destinations: string[] }>({
    origins: ['Bangalore', 'Mumbai'],
    destinations: ['Chennai', 'Hyderabad', 'Pune'],
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const [origin, setOrigin] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState(todayStr);
  const [busType, setBusType] = useState('');

  // Fetch registered cities from API
  useEffect(() => {
    async function loadCities() {
      const res = await api.get('/cities');
      if (res.success && res.data) {
        setCities({
          origins: res.data.origins.length ? res.data.origins : ['Bangalore', 'Mumbai'],
          destinations: res.data.destinations.length ? res.data.destinations : ['Chennai', 'Hyderabad', 'Pune'],
        });
      }
    }
    loadCities();
  }, []);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    onSearch({ origin, destination, date, busType: busType || undefined });
  };

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-3">
            <Bus className="w-3.5 h-3.5" /> Direct & Multi-Axle Intercity Buses
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Reserve Your Bus Seats with Guaranteed Availability
          </h1>
          <p className="mt-2 text-indigo-200 text-sm sm:text-base">
            Zero duplicate bookings with atomic ACID concurrency protection, live interactive seat layouts, and instant PNR issuance.
          </p>
        </div>

        {/* Search Bar Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white text-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        >
          {/* Origin */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Origin City
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {cities.origins.map((city) => (
                <option key={`orig-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center pt-5 md:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Destination City
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {cities.destinations.map((city) => (
                <option key={`dest-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Travel Date
            </label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Bus Type Filter */}
          <div className="w-full md:w-44">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-indigo-600" /> Bus Category
            </label>
            <select
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Bus Types</option>
              <option value="AC_SLEEPER">AC Sleeper</option>
              <option value="AC_SEATER">AC Seater</option>
              <option value="VOLVO_MULTI_AXLE">Volvo Multi-Axle</option>
              <option value="NON_AC_SEATER">Non-AC Seater</option>
            </select>
          </div>

          {/* Submit Search CTA */}
          <div className="pt-2 md:pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-1">⏳</span>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Find Buses
            </button>
          </div>
        </form>

        {/* Quick popular routes */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-indigo-200">
          <span className="font-semibold text-indigo-300">Quick Test Routes:</span>
          <button
            onClick={() => {
              setOrigin('Bangalore');
              setDestination('Chennai');
            }}
            className="hover:text-white underline decoration-dotted"
          >
            Bangalore → Chennai
          </button>
          <span>•</span>
          <button
            onClick={() => {
              setOrigin('Bangalore');
              setDestination('Hyderabad');
            }}
            className="hover:text-white underline decoration-dotted"
          >
            Bangalore → Hyderabad
          </button>
          <span>•</span>
          <button
            onClick={() => {
              setOrigin('Mumbai');
              setDestination('Pune');
            }}
            className="hover:text-white underline decoration-dotted"
          >
            Mumbai → Pune
          </button>
        </div>
      </div>
    </div>
  );
};
