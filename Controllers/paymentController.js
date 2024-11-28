import paypal from '@paypal/checkout-server-sdk';
import Booking from '../Models/bookingSchema.js';
import mongoose from 'mongoose';
import sendEmail from "../Utils/mailer.js";
import pdfkit from "pdfkit";
import fs from "fs";
import path from "path";

// PayPal Client Setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID, 
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'INR',
          value: booking.priceBreakdown.totalPrice.toFixed(2)
        },
        reference_id: booking.bookingReference
      }]
    });

    const order = await client.execute(request);

    res.status(201).json({
      orderID: order.result.id
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ message: "Failed to create PayPal order" });
  }
};

// Capture PayPal Payment
// Capture PayPal Payment
export const capturePayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderID, bookingId } = req.body;

    // Verify and capture the order
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client.execute(request);

    // Find and update booking
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Update booking payment details
    booking.payment.status = "paid";
    booking.payment.transactionId =
      capture.result.purchase_units[0].payments.captures[0].id;
    booking.payment.paymentMethod = "PayPal";
    booking.payment.paidAt = new Date();
    booking.bookingStatus = "confirmed";

    await booking.save({ session });

    // Generate PDF payment receipt
    const pdfPath = path.resolve(`./receipts/${booking.bookingReference}.pdf`);
    const doc = new pdfkit();

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(18).text("Payment Receipt", { align: "center" });
    doc.text(`\nBooking Reference: ${booking.bookingReference}`);
    doc.text('\n Price Breakdown:');
    doc.text('Room Cost: $' + booking.priceBreakdown.basePrice.toFixed(2));
    doc.text('Maintenance Charge: $' + booking.priceBreakdown.maintenanceCharge.toFixed(2));
    doc.text('Tax: $' + booking.priceBreakdown.tax.toFixed(2));
    doc.text(`Total Amount: $${booking.totalPrice}`);
    doc.text(`Payment Method: PayPal`);
    doc.text(`Transaction ID: ${booking.payment.transactionId}`);
    doc.text(`Paid At: ${booking.payment.paidAt}`);
    doc.end();

    // Wait for PDF generation
    await new Promise((resolve) => {
      doc.on("finish", resolve);
    });

    // Send email with PDF receipt
    await sendEmail(
      booking.customerEmail,
      "Booking Confirmation & Payment Receipt",
      "<p>Thank you for your payment. Please find your receipt attached.</p>",
      "",
      [
        {
          filename: `${booking.bookingReference}.pdf`,
          path: pdfPath,
        },
      ]
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Clean up the PDF after sending the email
    fs.unlink(pdfPath, (err) => {
      if (err) console.error("Error deleting PDF:", err);
    });

    res.status(200).json({
      message: "Payment successful, receipt sent via email",
      bookingStatus: booking.bookingStatus,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("PayPal payment capture error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Refund PayPal Payment
export const refundPayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking || booking.payment.status !== 'paid') {
      throw new Error("Cannot refund this booking");
    }

    // Create refund request
    const request = new paypal.payments.RefundsCreateRequest(
      booking.payment.transactionId
    );
    request.requestBody({
      amount: {
        currency_code: 'USD',
        value: booking.totalPrice.toFixed(2)
      }
    });

    const refund = await client.execute(request);

    // Update booking status
    booking.payment.status = 'refunded';
    booking.bookingStatus = 'cancelled';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: "Refund processed successfully",
      refundId: refund.result.id 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('PayPal refund error:', error);
    res.status(400).json({ message: error.message });
  }
};