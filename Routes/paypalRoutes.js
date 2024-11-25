import express from "express";
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { cancelPayment, createPayment, successPayment } from "../Controllers/paypalController.js";

const router = express.Router();

router.post("/create", authMiddleware, roleMiddleware("resident"), createPayment);
router.get("/cancel", authMiddleware, roleMiddleware("resident"), cancelPayment);
router.get("/success", authMiddleware, roleMiddleware("resident"), successPayment); 
router.post("/refund", authMiddleware, roleMiddleware("admin"), refundPayment); 

export default router;