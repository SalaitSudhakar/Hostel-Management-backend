import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { createExpense, getExpensesByCategory, getExpensesByDate } from '../Controllers/expenseController.js';


const router = express.Router();

router.post('/create', authMiddleware, roleMiddleware(['admin']), createExpense);
router.get('/expense-by-category', authMiddleware, roleMiddleware(['admin']), getExpensesByCategory);
router.get('/expense-by-date', authMiddleware, roleMiddleware(['admin']), getExpensesByDate);

export default router;