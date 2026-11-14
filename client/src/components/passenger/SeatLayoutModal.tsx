import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Check,
  Lock,
  User as UserIcon,
  AlertCircle,
  Clock,
  MapPin,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';

interface SeatItem {
  _id: string;
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number;
  seatType: 'SEATER' | 'SLEEPER';
  price: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  passengerGender?: string;
}

interface PassengerInput {
  seatNumber: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface SeatLayoutModalProps {
  tripId: string;
  onClose: () => void;
  onBookingSuccess: (pnr: string) => void;
}

export const SeatLayoutModal: React.FC<SeatLayoutModalProps> = ({
  tripId,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [tripData, setTripData] = useState<any>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [activeDeck, setActiveDeck] = useState<'LOWER' | 'UPPER'>('LOWER');

  // Passenger details
  const [passengers, setPassengers] = useState<Record<string, PassengerInput>>({});
  const [boardingStop, setBoardingStop] = useState<string>('');
  const [droppingStop, setDroppingStop] = useState<string>('');
  const [contactName, setContactName] = useState(user?.name || 'Aditya Verma');
  const [contactEmail, setContactEmail] = useState(user?.email || 'passenger@example.com');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91-9812345678');

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch live seat matrix
  const loadSeatData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const res = await api.get(`/trips/${tripId}/seats`);
    setIsLoading(false);

    if (res.success && res.data) {
      setTripData(res.data.trip);
      setSeats(res.data.seats);

      if (res.data.trip.boardingPoints?.length) {
        setBoardingStop(res.data.trip.boardingPoints[0].stopName);
      }
      if (res.data.trip.droppingPoints?.length) {
        setDroppingStop(res.data.trip.droppingPoints[res.data.trip.droppingPoints.length - 1].stopName);
      }
    } else {
      setErrorMessage(res.error?.message || 'Failed to load seat layout');
    }
  };

  useEffect(() => {
    loadSeatData();
  }, [tripId]);

  // Handle seat click
  const toggleSeatSelection = async (seat: SeatItem) => {
    if (seat.status !== 'AVAILABLE') return;

    setErrorMessage(null);
    const seatNum = seat.seatNumber;

    if (selectedSeatNumbers.includes(seatNum)) {
      // Deselect
      setSelectedSeatNumbers(selectedSeatNumbers.filter((s) => s !== seatNum));
      const nextPassengers = { ...passengers };
      delete nextPassengers[seatNum];
      setPassengers(nextPassengers);

      // Release lock API
      api.post('/trips/seats/release', { tripId, seatNumbers: [seatNum] });
    } else {
      // Maximum 6 seats per booking
      if (selectedSeatNumbers.length >= 6) {
        setErrorMessage('You can select a maximum of 6 seats per booking.');
        return;
      }

      // Optimistically lock seat
      const lockRes = await api.post('/trips/seats/lock', {
        tripId,
        seatNumbers: [seatNum],
      });

      if (!lockRes.success) {
        setErrorMessage(
          lockRes.error?.message || `Seat ${seatNum} could not be reserved. Another user might be booking it.`
        );
        loadSeatData(); // Refresh seat layout to show fresh status
        return;
      }

      setSelectedSeatNumbers([...selectedSeatNumbers, seatNum]);
      setPassengers({
        ...passengers,
        [seatNum]: {
          seatNumber: seatNum,
          passengerName: selectedSeatNumbers.length === 0 ? contactName : '',
          passengerAge: 25,
          passengerGender: 'MALE',
        },
      });
    }
  };

  // Calculate total price
  const totalAmount = selectedSeatNumbers.reduce((sum, num) => {
    const seat = seats.find((s) => s.seatNumber === num);
    return sum + (seat?.price || tripData?.baseFare || 0);
  }, 0);

  // Handle Confirm Booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeatNumbers.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    if (!boardingStop || !droppingStop) {
      setErrorMessage('Please select both boarding and dropping points.');
      return;
    }

    // Validate passenger inputs
    const passengerList: PassengerInput[] = [];
    for (const seatNum of selectedSeatNumbers) {
      const p = passengers[seatNum];
      if (!p || !p.passengerName.trim()) {
        setErrorMessage(`Please enter passenger name for seat ${seatNum}.`);
        return;
      }
      passengerList.push(p);
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const bookingPayload = {
      tripId,
      contactName,
      contactEmail,
      contactPhone,
      passengers: passengerList,
      boardingStop,
      droppingStop,
      idempotencyKey: `idemp_${Date.now()}_${Math.random()}`,
    };

    const res = await api.post('/bookings', bookingPayload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      onBookingSuccess(res.data.pnr);
    } else {
      setErrorMessage(
        res.error?.message ||
          'Failed to complete booking. Another passenger may have confirmed one of these seats.'
      );
      // Reload seat data to show current state
      loadSeatData();
    }
  };

  const hasUpperDeck = seats.some((s) => s.deck === 'UPPER');
  const visibleSeats = seats.filter((s) => s.deck === activeDeck);

  // Group visible seats by row
  const rowsMap = new Map<number, SeatItem[]>();
  for (const s of visibleSeats) {
    if (!rowsMap.has(s.row)) rowsMap.set(s.row, []);
    rowsMap.get(s.row)!.push(s);
  }
  const sortedRowKeys = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">Select Seats & Boarding Points</span>
              {tripData && (
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-semibold">
                  {tripData.tripCode}
                </span>
              )}
            </div>
            {tripData && (
              <p className="text-xs text-slate-400 mt-0.5">
                {tripData.operator?.name} • {tripData.bus?.busModel} ({tripData.bus?.busType})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Seat Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Deck Switcher for Sleeper buses */}
            {hasUpperDeck && (
              <div className="flex items-center justify-center mb-4 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveDeck('LOWER')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeDeck === 'LOWER'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lower Deck (Berths L1-L15)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeck('UPPER')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeDeck === 'UPPER'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upper Deck (Berths U1-U15)
                </button>
              </div>
            )}

            {/* Seat Map Legend */}
            <div className="flex items-center justify-around text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-white" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[9px]">
                  ✓
                </div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-100 border border-amber-400 flex items-center justify-center text-amber-700">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span>Locked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300 text-slate-400 flex items-center justify-center">
                  ✕
                </div>
                <span>Booked</span>
              </div>
            </div>

            {/* Bus Cabin Visual Layout */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-6 relative flex flex-col items-center">
              {/* Bus Front Driver Cabin Indicator */}
              <div className="w-full flex justify-end pb-3 mb-3 border-b border-slate-200">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  <span>Front / Driver Cabin 🚌</span>
                </div>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  <span className="inline-block animate-spin mr-2">⏳</span> Loading bus seat layout...
                </div>
              ) : (
                <div className="space-y-3 w-full max-w-sm">
                  {sortedRowKeys.map((rowNum) => {
                    const rowSeats = rowsMap.get(rowNum) || [];
                    return (
                      <div key={`row-${rowNum}`} className="flex items-center justify-between gap-2">
                        {/* Left Side Seats (Cols 1, 2) */}
                        <div className="flex items-center gap-2">
                          {rowSeats
                            .filter((s) => s.col <= 2)
                            .map((seat) => renderSeatButton(seat))}
                        </div>

                        {/* Center Gangway / Aisle */}
                        <div className="w-6 sm:w-8 text-center text-[10px] text-slate-300 font-mono select-none">
                          |
                        </div>

                        {/* Right Side Seats (Cols >= 3) */}
                        <div className="flex items-center gap-2">
                          {rowSeats
                            .filter((s) => s.col >= 3)
                            .map((seat) => renderSeatButton(seat))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Concurrency protection badge */}
            <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>
                <strong>ACID Seat Integrity:</strong> Selected seats are locked for 10 minutes to prevent simultaneous double-booking.
              </span>
            </div>
          </div>

          {/* Right Column: Boarding/Dropping & Passenger Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Stop Selections */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Trip Checkpoints
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Boarding Point:
                  </label>
                  <select
                    value={boardingStop}
                    onChange={(e) => setBoardingStop(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    required
                  >
                    {tripData?.boardingPoints?.map((bp: any) => (
                      <option key={bp.stopName} value={bp.stopName}>
                        {bp.stopName} ({new Date(bp.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Dropping Point:
                  </label>
                  <select
                    value={droppingStop}
                    onChange={(e) => setDroppingStop(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                    required
                  >
                    {tripData?.droppingPoints?.map((dp: any) => (
                      <option key={dp.stopName} value={dp.stopName}>
                        {dp.stopName} ({new Date(dp.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passenger Inputs */}
              {selectedSeatNumbers.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Passenger Manifest Details
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                    {selectedSeatNumbers.map((seatNum) => {
                      const p = passengers[seatNum] || {
                        seatNumber: seatNum,
                        passengerName: '',
                        passengerAge: 25,
                        passengerGender: 'MALE',
                      };
                      return (
                        <div
                          key={`p-${seatNum}`}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              Seat {seatNum}
                            </span>
                            <div className="flex items-center gap-2">
                              {(['MALE', 'FEMALE', 'OTHER'] as const).map((gender) => (
                                <label key={gender} className="inline-flex items-center gap-1 text-[10px]">
                                  <input
                                    type="radio"
                                    name={`gender-${seatNum}`}
                                    checked={p.passengerGender === gender}
                                    onChange={() =>
                                      setPassengers({
                                        ...passengers,
                                        [seatNum]: { ...p, passengerGender: gender },
                                      })
                                    }
                                  />
                                  <span>{gender[0]}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <input
                                type="text"
                                placeholder="Full Name"
                                value={p.passengerName}
                                onChange={(e) =>
                                  setPassengers({
                                    ...passengers,
                                    [seatNum]: { ...p, passengerName: e.target.value },
                                  })
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Age"
                                min={1}
                                max={120}
                                value={p.passengerAge}
                                onChange={(e) =>
                                  setPassengers({
                                    ...passengers,
                                    [seatNum]: { ...p, passengerAge: Number(e.target.value) },
                                  })
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Click on an available seat from the bus cabin on the left to begin booking.
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Ticket Notification
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="email"
                    placeholder="Email for PNR ticket"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Total & Checkout Button */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-slate-600">
                    Seats Selected ({selectedSeatNumbers.length}):
                  </span>
                  <span className="font-extrabold text-slate-900 text-lg">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedSeatNumbers.length === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin mr-1">⏳</span>
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Confirm & Pay ₹{totalAmount.toLocaleString()}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to render individual seat button
  function renderSeatButton(seat: SeatItem) {
    const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
    const isBooked = seat.status === 'BOOKED';
    const isLocked = seat.status === 'LOCKED';
    const isSleeper = seat.seatType === 'SLEEPER';

    let btnClass = 'border-2 border-emerald-500 bg-white hover:border-emerald-600 text-slate-800';
    if (isSelected) {
      btnClass = 'bg-indigo-600 border-indigo-700 text-white shadow-sm';
    } else if (isBooked) {
      btnClass = 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
    } else if (isLocked) {
      btnClass = 'bg-amber-100 border-amber-400 text-amber-800 cursor-not-allowed';
    }

    const dims = isSleeper ? 'w-16 h-10' : 'w-11 h-11';

    return (
      <button
        key={seat.seatNumber}
        type="button"
        disabled={isBooked || isLocked}
        onClick={() => toggleSeatSelection(seat)}
        className={`${dims} rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${btnClass}`}
        title={`Seat ${seat.seatNumber} • ${seat.status} • ₹${seat.price}`}
      >
        <span>{seat.seatNumber}</span>
        <span className="text-[8px] opacity-75">₹{seat.price}</span>
        {isSelected && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px]">
            ✓
          </span>
        )}
        {isLocked && !isSelected && (
          <span className="absolute -top-1 -right-1 text-amber-700">
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}
      </button>
    );
  }
};
