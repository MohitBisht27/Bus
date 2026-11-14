"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuditController_1 = require("../controllers/AuditController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Audit logs viewable by Admin
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), AuditController_1.AuditController.getLogs);
exports.default = router;
