import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth, requireRole, csrfProtection } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createUserSchema,
  createStoreSchema,
  userFilterSchema,
  storeFilterSchema,
} from '../../lib/schemas.js';

const router = Router();
const controller = new AdminController();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', controller.dashboard);
router.get('/users', validate(userFilterSchema, 'query'), controller.getUsers);
router.post('/users', csrfProtection, validate(createUserSchema), controller.createUser);
router.get('/users/:id', controller.getUserById);
router.get('/stores', validate(storeFilterSchema, 'query'), controller.getStores);
router.post('/stores', csrfProtection, validate(createStoreSchema), controller.createStore);
router.get('/owners/available', controller.getAvailableOwners);

export default router;
