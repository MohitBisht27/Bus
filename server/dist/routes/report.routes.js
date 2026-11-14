"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = require("../controllers/ReportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Passenger manifest for a trip (Operator & Admin)
router.get('/trips/:tripId/manifest', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), ReportController_1.ReportController.getTripManifest);
// Occupancy report across fleet (Operator & Admin)
router.get('/occupancy', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), ReportController_1.ReportController.getOccupancyReport);
// Executive dashboard overview KPIs
router.get('/dashboard-overview', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), ReportController_1.ReportController.getDashboardOverview);
exports.default = router;
