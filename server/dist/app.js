"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const trip_routes_1 = __importDefault(require("./routes/trip.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const operator_routes_1 = __importDefault(require("./routes/operator.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const policy_routes_1 = __importDefault(require("./routes/policy.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// Swagger API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.swaggerSpec);
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'OmniBus Backend API',
        uptime: process.uptime(),
    });
});
// Mount domain routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/trips', trip_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.use('/api', operator_routes_1.default); // /operators, /buses, /routes, /cities
app.use('/api/reports', report_routes_1.default);
app.use('/api/policies', policy_routes_1.default);
app.use('/api/audit-logs', audit_routes_1.default);
// Catch-all 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `The endpoint ${req.method} ${req.originalUrl} was not found on this server`,
        },
    });
});
// Central error handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
