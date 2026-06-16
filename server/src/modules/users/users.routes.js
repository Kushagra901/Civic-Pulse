import { Router } from 'express';
import { getUserProfile } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Public profiles — auth optional (email hidden for non-self)
router.get('/:userId', authenticate({ optional: true }), getUserProfile);

export default router;
