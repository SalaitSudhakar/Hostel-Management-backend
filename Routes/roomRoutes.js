import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { createRoom } from '../Controllers/roomController.js';

const router = express.Router();

router.post('/create', authMiddleware, roleMiddleware(['admin']), createRoom);

export default router;