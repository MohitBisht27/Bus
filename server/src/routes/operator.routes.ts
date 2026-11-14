import { Router } from 'express';
import { OperatorController } from '../controllers/OperatorController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { CreateOperatorSchema, CreateBusSchema, CreateRouteSchema } from '../schemas';

const router = Router();

// Cities list (public for search autocomplete)
router.get('/cities', OperatorController.getCities);

// Operators
router.get('/operators', OperatorController.getOperators);
router.post('/operators', authenticate, authorize('ADMIN'), validate(CreateOperatorSchema), OperatorController.createOperator);

// Buses
router.get('/buses', authenticate, authorize('ADMIN', 'OPERATOR'), OperatorController.getBuses);
router.post('/buses', authenticate, authorize('ADMIN'), validate(CreateBusSchema), OperatorController.createBus);

// Routes
router.get('/routes', authenticate, authorize('ADMIN', 'OPERATOR'), OperatorController.getRoutes);
router.post('/routes', authenticate, authorize('ADMIN'), validate(CreateRouteSchema), OperatorController.createRoute);

export default router;
