import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { roomOccupancyRateByDate } from '../Controllers/roomOccupancyController.js';

const router = express.Router();

router.get('/date-range', authMiddleware, roleMiddleware(['admin']), roomOccupancyRateByDate); 


export default router;