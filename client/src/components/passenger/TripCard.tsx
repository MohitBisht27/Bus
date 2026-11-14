import React from 'react';
import { Bus, Star, Clock, MapPin, Users, Wifi, Coffee, Zap } from 'lucide-react';

interface TripCardProps {
  trip: any;
  onSelectSeats: (tripId: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelectSeats }) => {
  const departureDate = new Date(trip.departureTime);
  const arrivalDate = new Date(trip.arrivalTime);

  const formattedDepTime = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedArrTime = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const depDayStr = departureDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const firstBoardingStop = trip.boardingPoints?.[0]?.stopName || trip.route?.originCity;
  const lastDroppingStop = trip.droppingPoints?.[trip.droppingPoints.length - 1]?.stopName || trip.route?.destinationCity;

  const busTypeLabels: Record<string, string> = {
    AC_SLEEPER: 'AC Sleeper (2+1)',
    AC_SEATER: 'Luxury 2+2 AC Seater',
    VOLVO_MULTI_AXLE: 'Volvo Multi-Axle B11R',
    NON_AC_SEATER: 'Express Non-AC Seater',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
      {/* Left: Operator & Bus Details */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-bold text-slate-900 text-lg">{trip.operator?.name}</span>
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-200">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {trip.operator?.rating?.toFixed(1) || '4.5'}
          </span>
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
            {busTypeLabels[trip.bus?.busType] || trip.bus?.busType}
          </span>
        </div>

        {/* Departure -> Duration -> Arrival timeline */}
        <div className="flex items-center gap-4 pt-1">
          <div>
            <div className="text-xl font-extrabold text-slate-900">{formattedDepTime}</div>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-600" />
              <span className="truncate max-w-[140px]">{firstBoardingStop}</span>
            </div>
            <div className="text-[10px] text-slate-400">{depDayStr}</div>
          </div>

          {/* Duration line */}
          <div className="flex-1 max-w-[130px] flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {trip.duration}
            </span>
            <div className="w-full flex items-center my-1">
              <div className="w-2 h-2 rounded-full border-2 border-indigo-600 bg-white" />
              <div className="flex-1 h-0.5 bg-slate-200 border-t border-dashed border-slate-400" />
              <div className="w-2 h-2 rounded-full bg-indigo-600" />
            </div>
            <span className="text-[10px] text-slate-400">Direct Route</span>
          </div>

          <div>
            <div className="text-xl font-extrabold text-slate-900">{formattedArrTime}</div>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span className="truncate max-w-[140px]">{lastDroppingStop}</span>
            </div>
            <div className="text-[10px] text-slate-400">{arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
          </div>
        </div>

        {/* Amenities pills */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            <Wifi className="w-3 h-3 text-slate-400" /> Wi-Fi
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            <Zap className="w-3 h-3 text-slate-400" /> Charging Port
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            <Coffee className="w-3 h-3 text-slate-400" /> Rest Stop
          </span>
        </div>
      </div>

      {/* Right: Availability, Fare & Select CTA */}
      <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 gap-3">
        <div className="text-left md:text-right">
          <span className="text-[11px] text-slate-400 block">Starting from</span>
          <div className="text-2xl font-extrabold text-slate-900">₹{trip.baseFare}</div>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
            <Users className="w-3 h-3" />
            <span>{trip.availableSeats} Seats Available</span>
          </div>
        </div>

        <button
          onClick={() => onSelectSeats(trip._id)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Bus className="w-4 h-4" />
          Select Seats
        </button>
      </div>
    </div>
  );
};
