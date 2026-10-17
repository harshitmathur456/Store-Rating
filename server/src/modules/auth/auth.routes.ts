import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, csrfProtection } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { signupSchema, loginSchema, changePasswordSchema } from '../../lib/schemas.js';

const router = Router();
const controller = new AuthController();

router.post('/signup', authLimiter, csrfProtection, validate(signupSchema), controller.signup);
router.post('/login', authLimiter, csrfProtection, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', requireAuth, csrfProtection, controller.logout);
router.get('/me', requireAuth, controller.me);
router.patch('/password', requireAuth, csrfProtection, validate(changePasswordSchema), controller.changePassword);

export default router;
