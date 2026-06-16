import { Router } from 'express';
import { getSignedUploadUrl } from './uploads.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Only authenticated users can request upload URLs
router.get('/sign', authenticate(), getSignedUploadUrl);

export default router;
