import axios from "axios";
import Booking from "../Models/bookingSchema.js";
import mongoose from "mongoose";
import sendEmail from "../Utils/mailer.js";
import pdfkit from "pdfkit";
import fs from "fs";
import path from "path";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// PayPal API URLs
const PAYPAL_API = process.env.PAYPAL_API; // Use sandbox for testing
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET || !PAYPAL_API) {
  console.error("PayPal environment variables are not set!");
  process.exit(1);
}

// Generate PayPal access token
const getPayPalAccessToken = async () => {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const response = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
};

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: booking.priceBreakdown.totalPrice.toFixed(2),
          },
          reference_id: booking.bookingReference,
        },
      ],
    };

    const orderResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const approvalUrl = orderResponse.data.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.status(201).json({
      message: "PayPal order created successfully",
      orderId: orderResponse.data.id,
      approvalUrl,
    });
  } catch (error) {
    console.error(
      "PayPal order creation error:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to create PayPal order" });
  }
};

// Capture PayPal Payment
export const capturePayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, orderId } = req.body;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get order details
    const orderResponse = await axios.get(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (orderResponse.data.status !== "APPROVED") {
      return res.status(400).json({ message: "Order not approved by payer" });
    }

    // Capture payment
    const captureResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (captureResponse.data.status !== "COMPLETED") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // Update booking details
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.payment = {
      status: "paid",
      captureId: captureResponse.data.id,
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
    resident.room = booking.room;
    resident.checkInDate = booking.checkInDate;
    resident.checkOutDate = booking.checkOutDate;
    await resident.save({ session });

    const room = await Room.findById(booking.room).session(session);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const totalGuests =
      booking.guests.adults +
      booking.guests.children +
      booking.guests.infantsUnder2;
    room.bedRemaining -= totalGuests;
    room.residents.push(resident._id);
    room.isAvailable = room.bedRemaining > 0;
    room.status =
      room.residents.length < room.capacity ? "reserved" : "occupied";
    await room.save({ session });

    // Generate and send PDF receipt
    const receiptDir = path.resolve("./receipts/");
    if (!fs.existsSync(receiptDir)) {
      fs.mkdirSync(receiptDir);
    }

    const pdfPath = path.resolve(`./receipts/${booking.bookingReference}.pdf`);
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(18).text("Payment Receipt", { align: "center" });
    doc.text(`\nBooking Reference: ${booking.bookingReference}`);
    doc.text("\nPrice Breakdown:");
    doc.text("Room Cost: $" + booking.priceBreakdown.basePrice.toFixed(2));
    doc.text(
      "Maintenance Charge: $" +
        booking.priceBreakdown.maintenanceCharge.toFixed(2)
    );
    doc.text("Tax: $" + booking.priceBreakdown.tax.toFixed(2));
    doc.text(`Total Amount: $${booking.priceBreakdown.totalPrice.toFixed(2)}`);
    doc.text(`Payment Method: PayPal`);
    doc.text(`Transaction ID: ${captureResponse.data.id}`);
    doc.text(`Paid At: ${new Date()}`);
    doc.end();

    await new Promise((resolve, reject) => {
      doc.on("finish", resolve);
      doc.on("error", reject);
    });

    const subject = `Payment Received - Booking ${booking.bookingReference}`;
    const html = `<h1>Payment Confirmation</h1><p>Booking Reference: ${booking.bookingReference}</p>`;
    const text = `Payment Confirmation\nBooking Reference: ${booking.bookingReference}`;
    const attachments = [
      { filename: `${booking.bookingReference}.pdf`, path: pdfPath },
    ];

    await sendEmail(resident.email, subject, html, text, attachments);

    fs.unlink(pdfPath, (err) => {
      if (err) console.error("Error deleting PDF:", err);
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Payment successful, receipt sent via email",
      bookingStatus: booking.bookingStatus,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(
      "PayPal payment capture error:",
      error.response?.data || error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Refund PayPal Payment (Optional)
export const refundPayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking || booking.payment.status !== "paid") {
      throw new Error("Cannot refund this booking");
    }

    const request = new paypal.payments.RefundsCreateRequest(
      booking.payment.captureId
    );
    request.requestBody({
      amount: {
        currency_code: "USD",
        value: booking.payment.amount.toFixed(2),
      },
    });

    const refund = await client.execute(request);
    booking.payment.status = "refunded";
    booking.bookingStatus = "cancelled";
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Refund processed successfully",
      refundId: refund.result.id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("PayPal refund error:", error);
    res.status(400).json({ message: error.message });
  }
};
