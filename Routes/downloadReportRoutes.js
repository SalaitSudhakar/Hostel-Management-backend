import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { downloadExpenseReport, downloadRevenueReport, downloadRoomOccupancyReport } from '../Controllers/downloadReportController.js';

const router = express.Router();

router.get('/expense', authMiddleware, roleMiddleware(['admin']), downloadExpenseReport );
router.get('/revenue', authMiddleware, roleMiddleware(['admin']), downloadRevenueReport);
router.get('/room-occupancy', authMiddleware, roleMiddleware(['admin']), downloadRoomOccupancyReport); 

export default router;