import { Router } from 'express';
import { OwnerController } from './owner.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ownerRatingsFilterSchema } from '../../lib/schemas.js';

const router = Router();
const controller = new OwnerController();

router.use(requireAuth, requireRole('OWNER'));

router.get('/dashboard', controller.dashboard);
router.get('/ratings', validate(ownerRatingsFilterSchema, 'query'), controller.getRaters);

export default router;
