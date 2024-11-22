import express from "express";
import { authMiddleware, roleMiddleware } from './../Middlewares/authMiddleware';
import { createPayment } from "../Controllers/paymentController";

const router = express.Router();

router.post("/create", authMiddleware, roleMiddleware("resident"), createPayment));
router.get("/cancel", authMiddleware, roleMiddleware("resident"), cancelPayment));
router.get("/success", authMiddleware, roleMiddleware("resident"), successPayment)); 

export default router;