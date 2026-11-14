"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OperatorController_1 = require("../controllers/OperatorController");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Cities list (public for search autocomplete)
router.get('/cities', OperatorController_1.OperatorController.getCities);
// Operators
router.get('/operators', OperatorController_1.OperatorController.getOperators);
router.post('/operators', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), (0, validate_1.validate)(schemas_1.CreateOperatorSchema), OperatorController_1.OperatorController.createOperator);
// Buses
router.get('/buses', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), OperatorController_1.OperatorController.getBuses);
router.post('/buses', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), (0, validate_1.validate)(schemas_1.CreateBusSchema), OperatorController_1.OperatorController.createBus);
// Routes
router.get('/routes', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'OPERATOR'), OperatorController_1.OperatorController.getRoutes);
router.post('/routes', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), (0, validate_1.validate)(schemas_1.CreateRouteSchema), OperatorController_1.OperatorController.createRoute);
exports.default = router;
