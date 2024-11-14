import express from 'express';
import { forgotPassword, getAllUsers, loginUser, registerUser, resetPassword } from '../Controllers/userControllers.js';
import { adminMiddleware, authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:id/:token', resetPassword);
router.get('/get-all-users',authMiddleware, adminMiddleware, getAllUsers);    


export default router;