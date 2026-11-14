# OmniBus: 3–5 Minute Walkthrough Video & Demonstration Script

**Role**: Full-Stack Engineering Candidate  
**Project**: Enterprise Bus Booking & Fleet Management System (MERN Stack)  
**Total Target Time**: 4 Minutes  

---

## Video Walkthrough Outline

| Timestamp | Phase | Screen / View | Action & Key Talking Points | Acceptance Criteria Shown |
| :--- | :--- | :--- | :--- | :--- |
| **0:00 – 0:35** | **Introduction & Architecture Overview** | Codebase & Terminal | • Introduce candidate name, project title, and MERN stack (MongoDB, Express, React, Node.js, Tailwind CSS).<br>• Show layered modular architecture (`server/src/services`, `models`, `client/src/components`).<br>• Point out Swagger UI documentation at `/api-docs`. | Architecture & Tech Stack |
| **0:35 – 1:30** | **Passenger Journey: Search & Seat Booking** | Customer View (`/`) | • Select route **Bangalore → Chennai** and travel date.<br>• Click **Find Buses** to show active operator trips with duration, boarding stops, and live available seat badges.<br>• Open **Select Seats** on Karnataka Royal Lines AC Sleeper.<br>• Switch between Lower Deck (L1-L15) and Upper Deck (U1-U15).<br>• Select seat **L5**, select boarding checkpoint, enter passenger details (Aditya Verma, 27, Male), and click **Confirm & Pay**.<br>• Show instant E-Ticket with unique PNR **BUS-XXXXXX**, QR code, and passenger manifest details. | **AC-1** & **AC-3** |
| **1:30 – 2:20** | **AC-2: Concurrency & Anti-Double-Booking Protection** | Terminal / 2 Browser Windows | • Explain the concurrency challenge: two users attempting to confirm the exact same seat on the same trip simultaneously.<br>• Show `server/test/concurrency.conflict.test.ts` where simultaneous requests (`Promise.all`) fire against seat `L12`.<br>• Run test in terminal: `npm test`.<br>• Show that exactly ONE request confirms with `201 Created` and the second request is immediately rejected with `409 Conflict (SEAT_ALREADY_BOOKED)`.<br>• Explain the compound unique index `{ tripId: 1, seatNumber: 1 }` and atomic compare-and-swap update. | **AC-2 (Critical Race Condition)** |
| **2:20 – 3:05** | **AC-4: Dynamic Cancellation & Simulated Refund** | Customer View (`My Tickets`) | • Navigate to **My Tickets** tab and look up the booking with PNR.<br>• Click **Cancel Booking** to trigger live refund preview modal.<br>• Point out the evaluated policy rule: *Departure is > 24 hours away $\to$ 90% refund, 10% cancellation fee*.<br>• Confirm cancellation: Status changes to `CANCELLED`, simulated refund status changes to `PROCESSED (₹2,277)`.<br>• Re-open the seat layout: Show that seat **L5** has immediately transitioned back to `AVAILABLE` (green border) and trip available seat count incremented by 1! | **AC-4** |
| **3:05 – 3:45** | **AC-5: Operator Manifest & Mathematical Reconciliation** | Operator Portal (`/operator`) | • Use the top reviewer banner to switch identity to **Operator (Rajesh - KRL)**.<br>• Point out occupancy statistics: Confirmed Seats, Available Seats, and Occupancy Rate (%).<br>• Click **View Manifest** to open the official boarding sheet.<br>• Demonstrate that confirmed tickets reconcile 1:1 with passengers on board.<br>• Click **Mark Boarded** next to a passenger: State changes to `Checked In` in real time with timestamp.<br>• Demonstrate CSV export and print view. | **AC-5** |
| **3:45 – 4:00** | **Admin Center, Audit Trail & Conclusion** | Admin Center (`/admin`) | • Switch to **System Admin**.<br>• Show Fleet Manager (buses, routes, schedules), Cancellation Policy rules editor, and the **Immutable Audit Trail Viewer** logging all material events (`SEATS_LOCKED`, `BOOKING_CREATED`, `BOOKING_CANCELLED`, `PASSENGER_CHECKIN`).<br>• Wrap up: All 5 acceptance tests passed, clean MERN codebase, zero-install reproducible setup. | Rubric Defense |

---

## Key Talking Points & Live Interview Defense

### 1. How does your system guarantee two users cannot book the same seat simultaneously?
> *"We implement a defense-in-depth concurrency guarantee at both the database and service layers. First, Mongoose enforces a compound unique index on `{ tripId: 1, seatNumber: 1 }`. Second, seat acquisition uses atomic compare-and-swap `TripSeat.findOneAndUpdate({ tripId, seatNumber, status: 'AVAILABLE' }, { status: 'BOOKED' })`. If two requests hit MongoDB concurrently, only the first transaction modifies the document; the second matches zero documents and is rejected with HTTP 409 Conflict. This is proven by our automated concurrency race condition test."*

### 2. How are cancellation rules evaluated?
> *"The `CancellationService` queries the active `CancellationPolicy` tiers at runtime. It computes the delta in milliseconds between trip departure and current system time. If the trip has departed, it rejects cancellation with a 400 error. Otherwise, it matches the applicable tier (>24h = 90% refund, 12-24h = 50%, <12h = 0%), calculates the refund and fee, updates the booking, atomically releases the seats to `AVAILABLE`, and writes an immutable audit record."*

### 3. How does the operator manifest reconcile with tickets?
> *"The manifest aggregates all bookings linked to a `tripId`. It computes total capacity, confirmed seats, cancelled seats, and checked-in counts, ensuring `totalSeats = confirmedSeats + availableSeats` mathematically. It allows bus drivers to mark passengers as checked in during boarding with instant audit trail logging."*
