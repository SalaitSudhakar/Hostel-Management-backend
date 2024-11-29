import paypal from '@paypal/checkout-server-sdk';
import Booking from '../Models/bookingSchema.js';
import mongoose from 'mongoose';
import sendEmail from "../Utils/mailer.js";
import pdfkit from "pdfkit";
import fs from "fs";
import path from "path";
import Room from '../Models/roomSchema.js';
import Resident from '../Models/residentSchema.js';

// PayPal Client Setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_SECRET
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
          currency_code: 'USD',
          value: booking.priceBreakdown.totalPrice.toFixed(2)
        },
        reference_id: booking.bookingReference
      }]
    });

    const order = await client.execute(request);
    res.status(201).json({
      message: "PayPal order created successfully", 
      orderId: order.result.id,
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ message: "Failed to create PayPal order" });
  }
};

// Capture PayPal Payment
export const capturePayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, orderId } = req.body;

    // Verify and capture the order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const capture = await client.execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // Find and update booking
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking payment details
    booking.payment = {
      status: "completed",
      captureId: capture.result.id,
      amount: booking.priceBreakdown.totalPrice,
      currency: "USD",
    };
    booking.bookingStatus = "confirmed";
    await booking.save({ session });

    const resident = await Resident.findById(booking.resident).session(session);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    resident.status = "active";
    resident.room = booking.room; // Assign roomId to resident
    resident.checkInDate = booking.checkInDate;
    resident.checkOutDate = booking.checkOutDate;
    await resident.save({ session });

    // Update room details
    const room = await Room.findById(booking.room).session(session);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const totalGuests = booking.guests.adults + booking.guests.children + booking.guests.infantsUnder2;
    room.bedRemaining -= totalGuests;
    room.residents.push(resident._id);
    room.isAvailable = room.bedRemaining > 0;
    room.status = room.residents.length < room.capacity ? "reserved" : "occupied";
    await room.save({ session });

    // Ensure the receipts directory exists
    const receiptDir = path.resolve('./receipts/');
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir);
    }

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
    await new Promise((resolve, reject) => {
      doc.on("finish", () => {
        console.log("PDF generation completed.");
        resolve();
      });
      doc.on("error", (err) => {
        console.error("Error generating PDF:", err);
        reject(err);
      });
    });

    const subject = `Payment Received - Booking ${booking.bookingReference}`;
    const html = `
      <h1>Payment Confirmation</h1>
      <p>Booking Reference: ${booking.bookingReference}</p>
      <p>Payment Amount: $${booking.priceBreakdown.totalPrice.toFixed(2)}</p>`;
    const text = `Payment Confirmation\nBooking Reference: ${booking.bookingReference}\nPayment Amount: $${booking.priceBreakdown.totalPrice.toFixed(2)}`;

    const attachments = [
      {
        filename: `${booking.bookingReference}.pdf`,
        path: pdfPath,
      },
    ];

    // Log and send email with PDF receipt
    console.log("Sending email with PDF...");
    await sendEmail(
      resident.email,
      subject,
      html,
      text,
      attachments
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
