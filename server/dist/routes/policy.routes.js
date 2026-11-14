"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PolicyController_1 = require("../controllers/PolicyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', PolicyController_1.PolicyController.getPolicy);
router.put('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), PolicyController_1.PolicyController.updatePolicy);
exports.default = router;
