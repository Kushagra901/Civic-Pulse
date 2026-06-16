import { Router } from 'express';
import {
  getTriageQueue, flagIncident, assignTeam,
  updateUserRole, banUser, getMetrics,
} from './admin.controller.js';
import { authenticate }    from '../../middleware/auth.js';
import { requireRole }     from '../../middleware/rbac.js';

const router = Router();

// All admin routes require authentication + MODERATOR or higher
router.use(authenticate());
router.use(requireRole('MODERATOR', 'ADMIN'));

router.get('/queue',                    getTriageQueue);
router.get('/metrics',                  getMetrics);
router.post('/incidents/:id/flag',      flagIncident);
router.post('/incidents/:id/assign',    assignTeam);

// Role and ban management — ADMIN only
router.patch('/users/:userId/role',
  requireRole('ADMIN'), updateUserRole);
router.patch('/users/:userId/ban',
  requireRole('ADMIN'), banUser);

export default router;
