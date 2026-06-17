import { Router } from 'express';
import { getSignedUploadUrl } from './uploads.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Only authenticated users can request upload URLs
router.get('/sign', authenticate(), uploadLimiter, getSignedUploadUrl);

export default router;
