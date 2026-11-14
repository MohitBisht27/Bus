# OmniBus REST API Documentation & Swagger Reference

The backend exposes a fully documented OpenAPI 3.0 specification available interactively via Swagger UI:
- **Interactive Swagger UI**: `http://localhost:5000/api-docs`
- **Raw OpenAPI JSON Spec**: `http://localhost:5000/api-docs.json`
- **Health Check Endpoint**: `http://localhost:5000/api/health`

---

## 1. Standard Response Envelope

All API endpoints return predictable JSON structures:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_BOOKED",
    "message": "Seat L5 is no longer available. It was already confirmed by another passenger.",
    "details": { "seatNumber": "L5", "tripId": "664422..." }
  }
}
```

---

## 2. API Endpoints Catalog

### Authentication & RBAC (`/api/auth`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Any | Register user account with role |
| `POST` | `/api/auth/login` | Public | Any | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Bearer JWT | Any | Get current authenticated user profile |

### Trip Discovery & Seat Inventory (`/api/trips`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/trips/search` | Public | Any | Search trips by `origin`, `destination`, `date`, `busType` |
| `GET` | `/api/trips/:id/seats` | Public | Any | Get 2D seat matrix and real-time seat availability |
| `POST` | `/api/trips/seats/lock` | Optional | Any | Atomically lock selected seats for 10 minutes |
| `POST` | `/api/trips/seats/release` | Optional | Any | Release locked seats back to available |
| `GET` | `/api/trips` | Bearer JWT | `OPERATOR`, `ADMIN` | List all scheduled trips with pagination |
| `POST` | `/api/trips` | Bearer JWT | `OPERATOR`, `ADMIN` | Schedule new trip and initialize seat inventory |

### Bookings & Cancellation (`/api/bookings`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Optional | Any | Confirm booking with atomic seat reservation & PNR |
| `GET` | `/api/bookings/pnr/:pnr` | Public | Any | Lookup e-ticket details by unique PNR |
| `GET` | `/api/bookings/my-bookings` | Bearer JWT | `PASSENGER` | List authenticated user booking history |
| `GET` | `/api/bookings/pnr/:pnr/cancel-preview` | Public | Any | Preview calculated refund amount and fee |
| `POST` | `/api/bookings/pnr/:pnr/cancel` | Optional | Any | Cancel booking, process simulated refund, free seat |
| `PATCH`| `/api/bookings/pnr/:pnr/check-in` | Bearer JWT | `OPERATOR`, `ADMIN`| Check-in passenger at bus boarding gate |

### Reports & Operator Manifests (`/api/reports`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/trips/:tripId/manifest` | Bearer JWT | `OPERATOR`, `ADMIN` | Passenger boarding manifest with 1:1 ticket reconciliation |
| `GET` | `/api/reports/occupancy` | Bearer JWT | `OPERATOR`, `ADMIN` | Fleet occupancy summary, capacity, and revenue stats |
| `GET` | `/api/reports/dashboard-overview` | Bearer JWT | `OPERATOR`, `ADMIN` | Executive KPI overview counters |

### Fleet & Route Setup (`/api`)
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cities` | Public | Any | List unique origin & destination cities |
| `GET` | `/api/operators` | Public | Any | List registered bus operators |
| `POST` | `/api/operators` | Bearer JWT | `ADMIN` | Create new bus operator profile |
| `GET` | `/api/buses` | Bearer JWT | `OPERATOR`, `ADMIN` | List bus fleet and seat layout templates |
| `POST` | `/api/buses` | Bearer JWT | `ADMIN` | Register bus vehicle with generated layout |
| `GET` | `/api/routes` | Bearer JWT | `OPERATOR`, `ADMIN` | List intercity routes and sequential stops |
| `POST` | `/api/routes` | Bearer JWT | `ADMIN` | Create intercity route with boarding/drop stops |

### Policies & Audit Logs
| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/policies` | Public | Any | Get active tiered cancellation policy rules |
| `PUT` | `/api/policies` | Bearer JWT | `ADMIN` | Update cancellation tiers and refund percentages |
| `GET` | `/api/audit-logs` | Bearer JWT | `ADMIN` | View immutable audit trail with filters |
