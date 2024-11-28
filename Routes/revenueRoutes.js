import express from 'express';
import { getRevenueByCategory, getRevenueByDate } from '../Controllers/revenueController.js';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';  

const router = express.Router();

router.get('/date-range', authMiddleware, roleMiddleware(['admin']),  getRevenueByDate);
router.get('/category', authMiddleware, roleMiddleware(['admin']),  getRevenueByCategory);


export default router;