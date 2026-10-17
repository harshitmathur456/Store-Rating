import { Router } from 'express';
import { StoreController } from './stores.controller.js';
import { requireAuth, requireRole, csrfProtection } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { userStoreFilterSchema, submitRatingSchema } from '../../lib/schemas.js';

const router = Router();
const controller = new StoreController();

router.use(requireAuth, requireRole('USER'));

router.get('/', validate(userStoreFilterSchema, 'query'), controller.getStores);
router.put('/:storeId/rating', csrfProtection, validate(submitRatingSchema), controller.upsertRating);

export default router;
