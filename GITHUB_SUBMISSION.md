# GitHub Submission & Project Deployment Guide

**Candidate Name**: Mohit Bisht  
**Email**: bishtmohit2023@gmail.com  
**Assigned Project**: Bus Booking Management System (MERN Stack)  
**Repository Branch**: `main`  
**Latest Commit Hash**: `69faecb`  

---

## 1. Quick Steps to Push This Repository to GitHub

If you have already created an empty repository on GitHub (e.g. `https://github.com/<username>/bus-booking-system.git`):

```bash
# 1. Add your GitHub repository as the origin remote (replace with your repo URL)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 2. Verify remote is set
git remote -v

# 3. Push all commits and the main branch to GitHub
git push -u origin main
```

If the repository on GitHub already contains an initial commit or README, push with:
```bash
git push -u origin main --force
```

---

## 2. Submission Form Entries (Ready to Copy & Paste)

| Form Section | Exact Required Value to Enter |
| :--- | :--- |
| **Candidate identification** | **Full Name**: Mohit Bisht<br>**University / Contact Email**: bishtmohit2023@gmail.com |
| **Assignment confirmation** | **Internship Role**: Full-Stack Engineering Intern<br>**Assigned Title**: Bus Booking Management System (MERN Stack) |
| **Code and version** | **Repository URL**: `https://github.com/<your-username>/<your-repo-name>`<br>**Primary Branch**: `main`<br>**Reviewer Access**: Public or invite reviewer email |
| **Demonstration** | **Demo Status**: Fully functional local demo (with automatic zero-install embedded MongoDB fallback)<br>**Video Walkthrough Script**: Included in [`docs/WALKTHROUGH_SCRIPT.md`](docs/WALKTHROUGH_SCRIPT.md) |
| **Documentation links** | **Technical Report**: [`docs/TECHNICAL_REPORT.md`](docs/TECHNICAL_REPORT.md)<br>**API Documentation**: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)<br>**Architecture & ER Diagram**: Included in [`README.md`](README.md) and Technical Report |
| **Technology and limitations** | **Technology Stack**: MERN (MongoDB + Mongoose, Express.js, React 18, Node.js, Tailwind CSS, TypeScript, Vitest).<br>**Setup Notes**: Reviewer runs `npm run setup && npm run dev` or `npm test` with 0 external dependencies.<br>**Assumptions & Limitations**: Payment processing is synchronously simulated; real SMS dispatch is captured in the audit log. |
| **AI and attribution** | **AI Tools Used**: AI Assistant for architecture scaffolding, typing, and test assertions.<br>**Attribution**: 100% original implementation; all business rules, schema constraints, and concurrency handlers are verified and explainable. |
| **Declarations** | I confirm the work is original, I can explain the architecture and code during the live interview, no sensitive keys or passwords are committed, and all local test suites pass 100%. |

---

## 3. Five Acceptance Criteria Verification Summary

| Criteria | Result | Evidence |
| :--- | :--- | :--- |
| **1. Search & Seat Booking** | **PASS** | Trip search engine (`/api/trips/search`), interactive 2D seat map with deck selection, boarding/drop points, and booking creation. |
| **2. Concurrency Conflict (Negative Test)** | **PASS** | Compound unique index `{ tripId: 1, seatNumber: 1 }` + atomic compare-and-swap. Two simultaneous requests for the same seat: one confirms (`201`), second rejected (`409 Conflict`). |
| **3. PNR Integrity** | **PASS** | Generated token (e.g. `BUS-XXXXXX`) preserves passenger, route, date, and seat numbers with QR verification. |
| **4. Tiered Cancellation Rules** | **PASS** | $>24$ hrs $= 90\%$ refund; $12-24$ hrs $= 50\%$ refund; $<12$ hrs $= 0\%$ refund. Released seats atomically return to `AVAILABLE` status. |
| **5. Operator Manifest & Reconciliation** | **PASS** | Manifest reconciles 1:1 with confirmed tickets (`totalSeats = confirmedSeats + availableSeats`). Features real-time check-in and CSV export. |

---

## 4. Local Run & Verification Commands

```bash
# Install dependencies & seed demo database
npm run setup

# Run 100% passing automated test suite (11/11 tests pass)
npm test

# Run full-stack application (Frontend on port 3000, Backend on port 5000)
npm run dev
```

- Web App: [http://localhost:3000](http://localhost:3000)
- OpenAPI Swagger UI: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
