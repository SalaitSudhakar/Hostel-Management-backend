import express from "express";
import { generateBill, recordPayment, generateBillPDF, sendBillEmail } from "../controllers/billingController.js";

const router = express.Router();

// Route to generate a new bill for a resident
router.post("/generate", generateBill);

// Route to record a payment for a bill
router.post("/:billId/payment", recordPayment);

// Route to generate a PDF bill
router.get("/:billId/pdf", generateBillPDF);

// Route to send the PDF bill via email to the resident
router.post("/:billId/send-email/:email", sendBillEmail);

export default router;
