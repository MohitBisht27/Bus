import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import bookingRoutes from './routes/booking.routes';
import operatorRoutes from './routes/operator.routes';
import reportRoutes from './routes/report.routes';
import policyRoutes from './routes/policy.routes';
import auditRoutes from './routes/audit.routes';

const app: Application = express();

// Middlewares - Permissive CORS to allow Netlify frontend and custom domains
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'OmniBus Backend API',
    uptime: process.uptime(),
  });
});

// Mount domain routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', operatorRoutes); // /operators, /buses, /routes, /cities
app.use('/api/reports', reportRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/audit-logs', auditRoutes);

// Optional: Serve client production build if available
import path from 'path';
import fs from 'fs';

const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Catch-all 404 handler for API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The endpoint ${req.method} ${req.originalUrl} was not found on this server`,
    },
  });
});

// Central error handler
app.use(errorHandler);

export default app;
