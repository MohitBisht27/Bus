import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Audit logs viewable by Admin
router.get('/', authenticate, authorize('ADMIN'), AuditController.getLogs);

export default router;
