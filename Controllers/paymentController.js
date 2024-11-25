import Billing from "../Models/billingSchema.js";
import Payment from "../Models/paymentSchema.js";

// Create a payment record (useful for logging pending or initiated payments)
export const createPaymentRecord = async (req, res) => {
  try {
    const { billingId, paymentMethod, amount, transactionId } = req.body;

    // Validate that the associated billing record exists
    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    // Create new payment record
    const payment = new Payment({
      billingId,
      paymentMethod,
      amount,
      transactionId,
      paymentStatus: "pending",
    });

    await payment.save();
    res.status(201).json({ message: "Payment record created successfully", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating payment record" });
  }
};

// Handle successful payment
export const successPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update the payment record to 'completed'
    payment.paymentStatus = "success";
    await payment.save();

    // Update billing record to reflect successful payment
    const billingRecord = await Billing.findById(payment.billingId);
    billingRecord.amountPaid += payment.amount;
    billingRecord.paymentStatus = "paid"; // Update payment status
    await billingRecord.save();

    res.status(200).json({ message: "Payment completed successfully", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing payment success" });
  }
};

// Get all payments for the logged-in user
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).populate("billingId");
    res.status(200).json({ payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user payments" });
  }
};

// Get all payments (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("user", "name email").populate("billingId");
    res.status(200).json({ payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all payments" });
  }
};

// Process a refund
export const processRefund = async (req, res) => {
  const { paymentId, refundAmount, refundTransactionId } = req.body;

  try {
    const paymentRecord = await Payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (paymentRecord.refundStatus === "completed") {
      return res.status(400).json({ message: "Refund already processed" });
    }

    // Update payment details
    paymentRecord.refundAmount = refundAmount;
    paymentRecord.refundTransactionId = refundTransactionId;
    paymentRecord.refundStatus = "initiated";
    await paymentRecord.save();

    // Update billing details
    const billingRecord = await Billing.findById(paymentRecord.billingId);
    billingRecord.refundAmount += refundAmount;
    billingRecord.refundStatus = "initiated";
    await billingRecord.save();

    res.status(200).json({ message: "Refund initiated successfully", paymentRecord });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Error processing refund" });
  }
};

// Complete the refund process (mark as completed)
export const completeRefund = async (req, res) => {
  const { paymentId } = req.body;

  try {
    const paymentRecord = await Payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (paymentRecord.refundStatus !== "initiated") {
      return res.status(400).json({ message: "Refund is not initiated or already completed" });
    }

    // Update refund status to 'completed'
    paymentRecord.refundStatus = "completed";
    await paymentRecord.save();

    // Update the billing record
    const billingRecord = await Billing.findById(paymentRecord.billingId);
    billingRecord.refundStatus = "completed";
    await billingRecord.save();

    res.status(200).json({ message: "Refund completed successfully", paymentRecord });
  } catch (error) {
    console.error("Error completing refund:", error);
    res.status(500).json({ message: "Error completing refund" });
  }
};
