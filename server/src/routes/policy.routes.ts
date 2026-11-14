import { Router } from 'express';
import { PolicyController } from '../controllers/PolicyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', PolicyController.getPolicy);
router.put('/', authenticate, authorize('ADMIN'), PolicyController.updatePolicy);

export default router;
