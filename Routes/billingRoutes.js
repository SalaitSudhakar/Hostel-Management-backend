import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { createBilling, deleteBillingRecord, getAllBillingRecords, getResidentBillingRecords, updateBillingStatus } from '../Controllers/billingController.js';


const router = express.Router();

router.post('/create',authMiddleware, roleMiddleware('resident'), createBilling);
router.get('/get-billings', authMiddleware, roleMiddleware('admin'), getAllBillingRecords);
router.get('/get-billings/:residentId', authMiddleware, roleMiddleware('resident'), getResidentBillingRecords);
router.put("/update-billing/:billingId/status", authMiddleware, roleMiddleware("admin"), updateBillingStatus);  
router.delete('/delete-billing/:billingId', authMiddleware, roleMiddleware('admin'), deleteBillingRecord);

export default router;