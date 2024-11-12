import express from 'express';
import { forgotPassword, loginUser, registerUser, resetPassword, updateUserRole } from '../Controllers/userControllers.js';
import { adminMiddleware, authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);    
router.post('/update-role', authMiddleware, adminMiddleware, updateUserRole);

export default router;