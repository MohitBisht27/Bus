import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OmniBus Booking Management API',
      version: '1.0.0',
      description:
        'Enterprise MERN Bus Booking Engine with atomic seat locking, ACID concurrency guarantees, RBAC, passenger manifests, and configurable cancellation policies.',
      contact: {
        name: 'OmniBus Engineering Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Current API Environment (Local & Production)',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Localhost Development Server',
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

export const swaggerSpec = swaggerJsdoc(options);
