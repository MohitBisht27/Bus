"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = require("./config/db");
const User_1 = require("./models/User");
const Operator_1 = require("./models/Operator");
const Bus_1 = require("./models/Bus");
const Route_1 = require("./models/Route");
const Trip_1 = require("./models/Trip");
const TripSeat_1 = require("./models/TripSeat");
const Booking_1 = require("./models/Booking");
const CancellationPolicy_1 = require("./models/CancellationPolicy");
const AuditLog_1 = require("./models/AuditLog");
function generateSleeperSeats(totalSeats) {
    const seats = [];
    const perDeck = totalSeats / 2;
    const rows = perDeck / 3;
    let lCount = 0;
    for (let r = 1; r <= rows; r++) {
        lCount++;
        seats.push({ seatNumber: `L${lCount}`, deck: 'LOWER', row: r, col: 1, seatType: 'SLEEPER', basePriceFactor: 1.1 });
        lCount++;
        seats.push({ seatNumber: `L${lCount}`, deck: 'LOWER', row: r, col: 2, seatType: 'SLEEPER', basePriceFactor: 1.1 });
        lCount++;
        seats.push({ seatNumber: `L${lCount}`, deck: 'LOWER', row: r, col: 4, seatType: 'SLEEPER', basePriceFactor: 1.2 });
    }
    let uCount = 0;
    for (let r = 1; r <= rows; r++) {
        uCount++;
        seats.push({ seatNumber: `U${uCount}`, deck: 'UPPER', row: r, col: 1, seatType: 'SLEEPER', basePriceFactor: 1.15 });
        uCount++;
        seats.push({ seatNumber: `U${uCount}`, deck: 'UPPER', row: r, col: 2, seatType: 'SLEEPER', basePriceFactor: 1.15 });
        uCount++;
        seats.push({ seatNumber: `U${uCount}`, deck: 'UPPER', row: r, col: 4, seatType: 'SLEEPER', basePriceFactor: 1.25 });
    }
    return seats;
}
function generateSeaterSeats(totalSeats) {
    const seats = [];
    const rows = totalSeats / 4;
    const colLetters = ['A', 'B', 'C', 'D'];
    let count = 0;
    for (let r = 1; r <= rows; r++) {
        for (let c = 0; c < 4; c++) {
            count++;
            seats.push({
                seatNumber: `${r}${colLetters[c]}`,
                deck: 'LOWER',
                row: r,
                col: c < 2 ? c + 1 : c + 2,
                seatType: 'SEATER',
                basePriceFactor: 1.0,
            });
        }
    }
    return seats;
}
async function seedDatabase() {
    console.log('[Seed] Starting database seed process...');
    await (0, db_1.connectDB)();
    // Clear existing collections
    await Promise.all([
        User_1.User.deleteMany({}),
        Operator_1.Operator.deleteMany({}),
        Bus_1.Bus.deleteMany({}),
        Route_1.Route.deleteMany({}),
        Trip_1.Trip.deleteMany({}),
        TripSeat_1.TripSeat.deleteMany({}),
        Booking_1.Booking.deleteMany({}),
        CancellationPolicy_1.CancellationPolicy.deleteMany({}),
        AuditLog_1.AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing data.');
    // 1. Cancellation Policy
    const policy = await CancellationPolicy_1.CancellationPolicy.create({
        name: 'National Intercity Standard Policy',
        description: 'Tiered refund rules based on hours prior to trip departure',
        isDefault: true,
        tiers: [
            {
                minHoursBeforeDeparture: 24,
                maxHoursBeforeDeparture: null,
                refundPercentage: 90,
                cancellationFeePercentage: 10,
                description: 'More than 24 hours prior to departure: 90% refund (10% fee)',
            },
            {
                minHoursBeforeDeparture: 12,
                maxHoursBeforeDeparture: 24,
                refundPercentage: 50,
                cancellationFeePercentage: 50,
                description: 'Between 12 and 24 hours prior: 50% refund (50% fee)',
            },
            {
                minHoursBeforeDeparture: 0,
                maxHoursBeforeDeparture: 12,
                refundPercentage: 0,
                cancellationFeePercentage: 100,
                description: 'Less than 12 hours prior: Non-refundable (0% refund)',
            },
        ],
    });
    console.log('[Seed] Created Cancellation Policy.');
    // 2. Operators
    const krlOperator = await Operator_1.Operator.create({
        name: 'Karnataka Royal Lines',
        code: 'KRL',
        contactEmail: 'contact@krl.com',
        contactPhone: '+91-9876543210',
        address: 'Majestic Bus Stand, Bangalore, KA',
        rating: 4.8,
        status: 'ACTIVE',
    });
    const greenlineOperator = await Operator_1.Operator.create({
        name: 'Greenline Express Travels',
        code: 'GLX',
        contactEmail: 'support@greenline.com',
        contactPhone: '+91-9844112233',
        address: 'Koyambedu CMBT, Chennai, TN',
        rating: 4.6,
        status: 'ACTIVE',
    });
    const srsOperator = await Operator_1.Operator.create({
        name: 'SRS Luxury Fleet',
        code: 'SRS',
        contactEmail: 'info@srstravels.com',
        contactPhone: '+91-9888997766',
        address: 'Shivajinagar, Pune, MH',
        rating: 4.7,
        status: 'ACTIVE',
    });
    console.log('[Seed] Created 3 Operators.');
    // 3. User Accounts with RBAC
    const adminUser = await User_1.User.create({
        name: 'System Administrator',
        email: 'admin@omnibus.com',
        password: 'Admin@12345',
        role: 'ADMIN',
        phone: '+91-9900011122',
    });
    const operatorUser = await User_1.User.create({
        name: 'Rajesh Sharma (KRL Ops)',
        email: 'operator@krl.com',
        password: 'Operator@12345',
        role: 'OPERATOR',
        operatorId: krlOperator._id,
        phone: '+91-9876543211',
    });
    const passengerUser = await User_1.User.create({
        name: 'Aditya Verma',
        email: 'passenger@example.com',
        password: 'Passenger@12345',
        role: 'PASSENGER',
        phone: '+91-9812345678',
    });
    console.log('[Seed] Created User Accounts (ADMIN, OPERATOR, PASSENGER).');
    // 4. Buses with Layouts
    const krlSleeperBus = await Bus_1.Bus.create({
        operatorId: krlOperator._id,
        registrationNumber: 'KA-01-EQ-9988',
        busModel: 'Volvo 9600 Multi-Axle AC Sleeper',
        busType: 'AC_SLEEPER',
        layoutType: 'SLEEPER_2x1',
        totalSeats: 30,
        seats: generateSleeperSeats(30),
        amenities: ['AC', 'Individual LCD Screen', 'Charging Ports', 'Blanket', 'Water Bottle', 'Wi-Fi'],
        status: 'ACTIVE',
    });
    const greenlineSeaterBus = await Bus_1.Bus.create({
        operatorId: greenlineOperator._id,
        registrationNumber: 'TN-09-AB-1122',
        busModel: 'Scania Metrolink HD 2+2 AC Seater',
        busType: 'AC_SEATER',
        layoutType: '2x2',
        totalSeats: 36,
        seats: generateSeaterSeats(36),
        amenities: ['AC', 'Pushback Seats', 'Charging Ports', 'Emergency Exit'],
        status: 'ACTIVE',
    });
    const srsSeaterBus = await Bus_1.Bus.create({
        operatorId: srsOperator._id,
        registrationNumber: 'MH-12-PQ-4455',
        busModel: 'Mercedes-Benz SHD Multi-Axle',
        busType: 'VOLVO_MULTI_AXLE',
        layoutType: '2x2',
        totalSeats: 40,
        seats: generateSeaterSeats(40),
        amenities: ['AC', 'Reclining Seats', 'Live GPS Tracking', 'CCTV'],
        status: 'ACTIVE',
    });
    console.log('[Seed] Created 3 Buses with Seat Layout Templates.');
    // 5. Routes & Stops
    const blrToChnRoute = await Route_1.Route.create({
        name: 'Bangalore - Chennai Highway Corridor',
        originCity: 'Bangalore',
        destinationCity: 'Chennai',
        totalDistanceKm: 345,
        estimatedDurationMinutes: 360,
        stops: [
            { stopName: 'Majestic Anand Rao Circle', landmark: 'Platform 4', stopType: 'BOARDING', sequence: 1, offsetMinutesFromStart: 0 },
            { stopName: 'Silk Board Junction', landmark: 'Near Police Station', stopType: 'BOARDING', sequence: 2, offsetMinutesFromStart: 45 },
            { stopName: 'Electronic City Toll Plaza', landmark: 'Toll Gate 1', stopType: 'BOARDING', sequence: 3, offsetMinutesFromStart: 60 },
            { stopName: 'Hosur Bus Stand', landmark: 'Highway Cross', stopType: 'BOTH', sequence: 4, offsetMinutesFromStart: 100 },
            { stopName: 'Sriperumbudur Bypass', landmark: 'Toll Plaza', stopType: 'DROPPING', sequence: 5, offsetMinutesFromStart: 300 },
            { stopName: 'Koyambedu CMBT', landmark: 'Gate 2 Omnibus Stand', stopType: 'DROPPING', sequence: 6, offsetMinutesFromStart: 360 },
        ],
        status: 'ACTIVE',
    });
    const blrToHydRoute = await Route_1.Route.create({
        name: 'Bangalore - Hyderabad Express',
        originCity: 'Bangalore',
        destinationCity: 'Hyderabad',
        totalDistanceKm: 575,
        estimatedDurationMinutes: 510,
        stops: [
            { stopName: 'Majestic Bus Terminal', landmark: 'Opposite Railway Station', stopType: 'BOARDING', sequence: 1, offsetMinutesFromStart: 0 },
            { stopName: 'Hebbal Flyover', landmark: 'Esteem Mall', stopType: 'BOARDING', sequence: 2, offsetMinutesFromStart: 35 },
            { stopName: 'Anantapur Bypass', landmark: 'Highway Flyover', stopType: 'BOTH', sequence: 3, offsetMinutesFromStart: 240 },
            { stopName: 'Kurnool Toll Gate', landmark: 'Toll Plaza', stopType: 'BOTH', sequence: 4, offsetMinutesFromStart: 360 },
            { stopName: 'Shamshabad Airport Cross', landmark: 'Airport Entrance', stopType: 'DROPPING', sequence: 5, offsetMinutesFromStart: 480 },
            { stopName: 'Ameerpet Metro Hub', landmark: 'Metro Pillar 104', stopType: 'DROPPING', sequence: 6, offsetMinutesFromStart: 510 },
        ],
        status: 'ACTIVE',
    });
    const mumToPuneRoute = await Route_1.Route.create({
        name: 'Mumbai - Pune Expressway Superfast',
        originCity: 'Mumbai',
        destinationCity: 'Pune',
        totalDistanceKm: 150,
        estimatedDurationMinutes: 180,
        stops: [
            { stopName: 'Borivali West', landmark: 'Gokul Hotel', stopType: 'BOARDING', sequence: 1, offsetMinutesFromStart: 0 },
            { stopName: 'Dadar TT Circle', landmark: 'Asiad Stand', stopType: 'BOARDING', sequence: 2, offsetMinutesFromStart: 45 },
            { stopName: 'Vashi Plaza', landmark: 'Highway Bridge', stopType: 'BOARDING', sequence: 3, offsetMinutesFromStart: 75 },
            { stopName: 'Wakad Bridge', landmark: 'Ginger Hotel', stopType: 'DROPPING', sequence: 4, offsetMinutesFromStart: 150 },
            { stopName: 'Swargate Bus Station', landmark: 'Depot 1', stopType: 'DROPPING', sequence: 5, offsetMinutesFromStart: 180 },
        ],
        status: 'ACTIVE',
    });
    console.log('[Seed] Created 3 Intercity Routes with Detailed Stops.');
    // 6. Generate Trips for multiple upcoming days
    const now = new Date();
    const createdTrips = [];
    // Helper to schedule a trip on a specific day offset
    async function createSeedTrip(bus, route, operator, dayOffset, startHour, baseFare, codeSuffix) {
        const depDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, startHour, 30, 0);
        const arrDate = new Date(depDate.getTime() + route.estimatedDurationMinutes * 60 * 1000);
        const boardingPoints = route.stops
            .filter((s) => s.stopType === 'BOARDING' || s.stopType === 'BOTH')
            .map((s) => ({
            stopName: s.stopName,
            time: new Date(depDate.getTime() + (s.offsetMinutesFromStart || 0) * 60 * 1000),
            stopType: s.stopType,
            sequence: s.sequence,
        }));
        const droppingPoints = route.stops
            .filter((s) => s.stopType === 'DROPPING' || s.stopType === 'BOTH')
            .map((s) => ({
            stopName: s.stopName,
            time: new Date(depDate.getTime() + (s.offsetMinutesFromStart || 0) * 60 * 1000),
            stopType: s.stopType,
            sequence: s.sequence,
        }));
        const trip = await Trip_1.Trip.create({
            tripCode: `TRIP-${operator.code}-${depDate.toISOString().slice(0, 10).replace(/-/g, '')}-${codeSuffix}`,
            operatorId: operator._id,
            busId: bus._id,
            routeId: route._id,
            departureTime: depDate,
            arrivalTime: arrDate,
            baseFare,
            status: 'SCHEDULED',
            boardingPoints,
            droppingPoints,
            totalSeats: bus.totalSeats,
            availableSeats: bus.totalSeats,
        });
        const seatDocs = bus.seats.map((seat) => ({
            tripId: trip._id,
            seatNumber: seat.seatNumber,
            deck: seat.deck,
            row: seat.row,
            col: seat.col,
            seatType: seat.seatType,
            price: Math.round(baseFare * (seat.basePriceFactor || 1.0)),
            status: 'AVAILABLE',
        }));
        await TripSeat_1.TripSeat.insertMany(seatDocs);
        createdTrips.push(trip);
        return trip;
    }
    // Create trips for Today (dayOffset: 0), Tomorrow (dayOffset: 1), Day after tomorrow (dayOffset: 2), and 3 days out
    for (let d = 0; d <= 4; d++) {
        // 1. KRL Sleeper Bangalore -> Chennai (Night sleeper 22:30)
        await createSeedTrip(krlSleeperBus, blrToChnRoute, krlOperator, d, 22, 1150, `BLRCHN-${d}`);
        // 2. Greenline Seater Bangalore -> Chennai (Morning 06:30)
        await createSeedTrip(greenlineSeaterBus, blrToChnRoute, greenlineOperator, d, 6, 750, `GLXBC-${d}`);
        // 3. KRL Sleeper Bangalore -> Hyderabad (Night 21:00)
        await createSeedTrip(krlSleeperBus, blrToHydRoute, krlOperator, d, 21, 1400, `BLRHYD-${d}`);
        // 4. SRS Seater Mumbai -> Pune (Afternoon 14:00)
        await createSeedTrip(srsSeaterBus, mumToPuneRoute, srsOperator, d, 14, 450, `MUMPUN-${d}`);
    }
    console.log(`[Seed] Generated ${createdTrips.length} scheduled trips with discrete seat inventories.`);
    // 7. Create a pre-existing Confirmed Booking with PNR "BUS-DEMO1"
    const targetTrip = createdTrips[0];
    const bookedSeatNumbers = ['L1', 'L2'];
    await TripSeat_1.TripSeat.updateMany({ tripId: targetTrip._id, seatNumber: { $in: bookedSeatNumbers } }, { $set: { status: 'BOOKED', passengerGender: 'MALE' } });
    await Trip_1.Trip.findByIdAndUpdate(targetTrip._id, {
        $inc: { availableSeats: -bookedSeatNumbers.length },
    });
    const demoBooking = await Booking_1.Booking.create({
        pnr: 'BUS-DEMO1',
        tripId: targetTrip._id,
        userId: passengerUser._id,
        passenger: {
            name: 'Aditya Verma',
            email: 'passenger@example.com',
            phone: '+91-9812345678',
        },
        seats: [
            {
                seatNumber: 'L1',
                fare: 1265,
                seatType: 'SLEEPER',
                passengerName: 'Aditya Verma',
                passengerAge: 27,
                passengerGender: 'MALE',
            },
            {
                seatNumber: 'L2',
                fare: 1265,
                seatType: 'SLEEPER',
                passengerName: 'Rohit Verma',
                passengerAge: 24,
                passengerGender: 'MALE',
            },
        ],
        boardingPoint: targetTrip.boardingPoints[0],
        droppingPoint: targetTrip.droppingPoints[targetTrip.droppingPoints.length - 1],
        totalFare: 2530,
        paidAmount: 2530,
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        checkedIn: false,
    });
    await TripSeat_1.TripSeat.updateMany({ tripId: targetTrip._id, seatNumber: { $in: bookedSeatNumbers } }, { $set: { bookingId: demoBooking._id } });
    console.log('[Seed] Created Confirmed Booking with PNR "BUS-DEMO1".');
    // 8. Log initial audit records
    await AuditLog_1.AuditLog.create([
        {
            action: 'SYSTEM_INITIALIZED',
            entityType: 'System',
            userName: 'System Administrator',
            userRole: 'ADMIN',
            details: { version: '1.0.0', routes: 3, operators: 3, buses: 3 },
            ipAddress: '127.0.0.1',
        },
        {
            action: 'BOOKING_CREATED',
            entityType: 'Booking',
            entityId: demoBooking._id.toString(),
            userName: 'Aditya Verma',
            userRole: 'PASSENGER',
            details: { pnr: 'BUS-DEMO1', seats: ['L1', 'L2'], totalFare: 2530 },
            ipAddress: '127.0.0.1',
        },
    ]);
    console.log('[Seed] Created Initial Audit Log Entries.');
    console.log('\n======================================================');
    console.log(' SEED COMPLETED SUCCESSFULLY!');
    console.log(' Demo Accounts:');
    console.log(' - Admin:     admin@omnibus.com      / Admin@12345');
    console.log(' - Operator:  operator@krl.com       / Operator@12345');
    console.log(' - Passenger: passenger@example.com  / Passenger@12345');
    console.log(' Demo PNR:    BUS-DEMO1');
    console.log('======================================================\n');
}
// Allow direct CLI execution: ts-node src/seed.ts
if (require.main === module) {
    seedDatabase()
        .then(async () => {
        await (0, db_1.disconnectDB)();
        process.exit(0);
    })
        .catch(async (err) => {
        console.error('[Seed Error]:', err);
        await (0, db_1.disconnectDB)();
        process.exit(1);
    });
}
