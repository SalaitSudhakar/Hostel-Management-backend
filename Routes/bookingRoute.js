import express from 'express';
import { bookARoom, checkOutResident, getAllResidents } from '../Controllers/bookingController.js';


const router = express.Router();

router.post('/booking', bookARoom);
router.get('/getallresidents', getAllResidents);
router.post('/checkout', checkOutResident);

export default router;