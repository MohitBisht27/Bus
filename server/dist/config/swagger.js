"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'OmniBus Booking Management API',
            version: '1.0.0',
            description: 'Enterprise MERN Bus Booking Engine with atomic seat locking, ACID concurrency guarantees, RBAC, passenger manifests, and configurable cancellation policies.',
            contact: {
                name: 'OmniBus Engineering Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string', enum: ['PASSENGER', 'OPERATOR', 'ADMIN'] },
                    },
                },
                Trip: {
                    type: 'object',
                    properties: {
                        tripCode: { type: 'string' },
                        departureTime: { type: 'string', format: 'date-time' },
                        arrivalTime: { type: 'string', format: 'date-time' },
                        baseFare: { type: 'number' },
                        availableSeats: { type: 'number' },
                    },
                },
                Booking: {
                    type: 'object',
                    properties: {
                        pnr: { type: 'string' },
                        tripId: { type: 'string' },
                        totalFare: { type: 'number' },
                        bookingStatus: { type: 'string', enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'] },
                        paymentStatus: { type: 'string', enum: ['PAID', 'REFUNDED'] },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
