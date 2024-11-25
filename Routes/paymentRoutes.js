import express from "express";
import { authMiddleware, roleMiddleware } from "../Middlewares/authMiddleware.js";
import { createPayment, successPayment ,getAllPayments, getUserPayments } from "../Controllers/paymentController.js";
// import { processRefund, completeRefund } from "../Controllers/paymentController.js";

const router = express.Router();

router.post("/create", authMiddleware, createPayment);
router.post("/success", authMiddleware, successPayment);
router.get("/user-payments", authMiddleware, getUserPayments);
router.get("/all-payments", authMiddleware, roleMiddleware("admin "), getAllPayments);
/* router.post("/refund", authMiddleware, process);
router.post("/refund/complete", authMiddleware, roleMiddleware("admin"), completeRefund);    */

export default router;