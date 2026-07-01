import { Router } from 'express';
import { getHealth, getLiveness } from './health.controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/health/live', getLiveness);

export default router;
