import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bus, MapPin, Plus, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export const FleetManager: React.FC = () => {
  const [operators, setOperators] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  // Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'operators' | 'buses' | 'routes' | 'schedule'>('operators');

  // Form states
  const [newOpName, setNewOpName] = useState('');
  const [newOpCode, setNewOpCode] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');
  const [newOpPhone, setNewOpPhone] = useState('');

  // New Bus form
  const [selectedOpForBus, setSelectedOpForBus] = useState('');
  const [newBusReg, setNewBusReg] = useState('');
  const [newBusModel, setNewBusModel] = useState('');
  const [newBusType, setNewBusType] = useState('AC_SLEEPER');
  const [newBusLayout, setNewBusLayout] = useState('SLEEPER_2x1');
  const [newBusSeats, setNewBusSeats] = useState(30);

  // New Trip Schedule form
  const [schedOperatorId, setSchedOperatorId] = useState('');
  const [schedBusId, setSchedBusId] = useState('');
  const [schedRouteId, setSchedRouteId] = useState('');
  const [schedDepTime, setSchedDepTime] = useState('');
  const [schedArrTime, setSchedArrTime] = useState('');
  const [schedFare, setSchedFare] = useState(950);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    const [opRes, busRes, routeRes] = await Promise.all([
      api.get('/operators'),
      api.get('/buses'),
      api.get('/routes'),
    ]);
    setIsLoading(false);

    if (opRes.success && opRes.data) {
      setOperators(opRes.data);
      if (opRes.data.length > 0) {
        setSelectedOpForBus(opRes.data[0]._id);
        setSchedOperatorId(opRes.data[0]._id);
      }
    }
    if (busRes.success && busRes.data) {
      setBuses(busRes.data);
      if (busRes.data.length > 0) setSchedBusId(busRes.data[0]._id);
    }
    if (routeRes.success && routeRes.data) {
      setRoutes(routeRes.data);
      if (routeRes.data.length > 0) setSchedRouteId(routeRes.data[0]._id);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Create Operator
  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/operators', {
      name: newOpName,
      code: newOpCode,
      contactEmail: newOpEmail,
      contactPhone: newOpPhone,
    });
    if (res.success) {
      setMessage({ type: 'success', text: `Operator "${newOpName}" created successfully!` });
      setNewOpName('');
      setNewOpCode('');
      setNewOpEmail('');
      setNewOpPhone('');
      loadAll();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Failed to create operator' });
    }
  };

  // Create Bus
  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/buses', {
      operatorId: selectedOpForBus,
      registrationNumber: newBusReg,
      busModel: newBusModel,
      busType: newBusType,
      layoutType: newBusLayout,
      totalSeats: newBusSeats,
    });
    if (res.success) {
      setMessage({ type: 'success', text: `Bus "${newBusReg}" registered with layout successfully!` });
      setNewBusReg('');
      setNewBusModel('');
      loadAll();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Failed to create bus' });
    }
  };

  // Schedule Trip
  const handleScheduleTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDepTime || !schedArrTime) {
      setMessage({ type: 'error', text: 'Please provide departure and arrival times' });
      return;
    }
    const res = await api.post('/trips', {
      operatorId: schedOperatorId,
      busId: schedBusId,
      routeId: schedRouteId,
      departureTime: new Date(schedDepTime).toISOString(),
      arrivalTime: new Date(schedArrTime).toISOString(),
      baseFare: Number(schedFare),
    });
    if (res.success) {
      setMessage({ type: 'success', text: 'Trip scheduled and seat inventory generated!' });
      loadAll();
    } else {
      setMessage({ type: 'error', text: res.error?.message || 'Failed to schedule trip' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: 'operators', label: 'Operators' },
            { id: 'buses', label: 'Bus Fleet & Layouts' },
            { id: 'routes', label: 'Routes & Stops' },
            { id: 'schedule', label: 'Schedule New Trip' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === t.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
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

      {/* Operators Subtab */}
      {activeSubTab === 'operators' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Registered Bus Operators ({operators.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {operators.map((op) => (
                <div key={op._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{op.name}</span>
                    <span className="text-[10px] text-slate-500 block">{op.contactEmail} • {op.contactPhone}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {op.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Operator</h3>
            <form onSubmit={handleCreateOperator} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Operator Name (e.g. Royal Express)"
                value={newOpName}
                onChange={(e) => setNewOpName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                required
              />
              <input
                type="text"
                placeholder="Code (e.g. RYX)"
                value={newOpCode}
                onChange={(e) => setNewOpCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 uppercase"
                required
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={newOpEmail}
                onChange={(e) => setNewOpEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newOpPhone}
                onChange={(e) => setNewOpPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Create Operator
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buses Subtab */}
      {activeSubTab === 'buses' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Fleet Vehicles & Layouts ({buses.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {buses.map((b) => (
                <div key={b._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{b.registrationNumber}</span>
                    <span className="text-[10px] text-slate-500 block">{b.busModel} • {b.busType}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-700">{b.totalSeats} Seats</span>
                    <span className="text-[10px] text-slate-400 block">{b.layoutType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Register New Bus Vehicle</h3>
            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign Operator</label>
                <select
                  value={selectedOpForBus}
                  onChange={(e) => setSelectedOpForBus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  {operators.map((op) => (
                    <option key={op._id} value={op._id}>{op.name} ({op.code})</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Registration # (e.g. KA-04-MB-1234)"
                value={newBusReg}
                onChange={(e) => setNewBusReg(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                required
              />
              <input
                type="text"
                placeholder="Bus Model (e.g. Volvo 9600 Multi-Axle)"
                value={newBusModel}
                onChange={(e) => setNewBusModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bus Type</label>
                  <select
                    value={newBusType}
                    onChange={(e) => setNewBusType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="AC_SLEEPER">AC Sleeper</option>
                    <option value="AC_SEATER">AC Seater</option>
                    <option value="VOLVO_MULTI_AXLE">Volvo Multi-Axle</option>
                    <option value="NON_AC_SEATER">Non-AC Seater</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={newBusSeats}
                    min={4}
                    max={60}
                    onChange={(e) => setNewBusSeats(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Generate Layout & Save Bus
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Routes Subtab */}
      {activeSubTab === 'routes' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Configured Routes & Sequential Stops ({routes.length})</h3>
          <div className="space-y-4">
            {routes.map((r) => (
              <div key={r._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                  <span className="text-slate-500">{r.totalDistanceKm} km • {Math.floor(r.estimatedDurationMinutes / 60)}h {r.estimatedDurationMinutes % 60}m</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {r.stops?.map((s: any, idx: number) => (
                    <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-bold">{s.sequence}.</span>
                      <span>{s.stopName}</span>
                      <span className="text-[9px] text-indigo-600 font-bold">({s.stopType})</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Trip Subtab */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Schedule New Departure & Initialize Seat Inventory
          </h3>
          <form onSubmit={handleScheduleTrip} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Operator</label>
              <select
                value={schedOperatorId}
                onChange={(e) => setSchedOperatorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800"
              >
                {operators.map((op) => (
                  <option key={op._id} value={op._id}>{op.name} ({op.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Bus Vehicle</label>
              <select
                value={schedBusId}
                onChange={(e) => setSchedBusId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800"
              >
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>{b.registrationNumber} - {b.busModel} ({b.totalSeats} seats)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Select Route</label>
              <select
                value={schedRouteId}
                onChange={(e) => setSchedRouteId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800"
              >
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>{r.name} ({r.originCity} → {r.destinationCity})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  value={schedDepTime}
                  onChange={(e) => setSchedDepTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  value={schedArrTime}
                  onChange={(e) => setSchedArrTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Base Seat Fare (INR)</label>
              <input
                type="number"
                value={schedFare}
                min={50}
                onChange={(e) => setSchedFare(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
            >
              Generate Trip & Initialize Seats
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
