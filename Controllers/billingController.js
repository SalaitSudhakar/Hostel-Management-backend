import Billing from "../Models/billingSchema.js";
import Resident from "../Models/residentSchema.js";
import MaintenanceRequest from "../Models/maintanenceRequestSchema.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cron from "node-cron";


// Calculate service charge based on maintenance requests for a given resident and period
export const calculateServiceCharge = async (residentId, startDate, endDate) => {
  const maintenanceRequests = await MaintenanceRequest.find({
    resident: residentId,
    requestDate: { $gte: startDate, $lte: endDate },
  });

  return maintenanceRequests.reduce((total, request) => total + request.cost, 0);
};

// Generate a new monthly bill for a resident
export const generateBill = async (resident, startDate, endDate, dueDate, lateFee) => {
  try {
    const room = resident.room;
    const monthlyRate = room.price;

    // Calculate service charge for the month
    const serviceCharge = await calculateServiceCharge(resident._id, startDate, endDate);
    const amountDue = monthlyRate + serviceCharge + (lateFee || 0);

    const newBill = new Billing({
      resident: resident._id,
      room: room._id,
      billingPeriod: { startDate, endDate },
      amountDue,
      dueDate,
      lateFee: lateFee || 0,
      serviceCharge,
    });

    await newBill.save();

    // Generate PDF and email it
    await generateBillPDF(newBill);
    await sendBillEmail(newBill, resident.email);

    console.log(`Bill generated for ${resident.name} for period ${startDate.toDateString()} - ${endDate.toDateString()}`);
  } catch (error) {
    console.error(`Error generating bill for resident ${resident._id}: ${error.message}`);
  }
};

// Generate a PDF bill
export const generateBillPDF = async (bill) => {
  const pdfPath = path.join("bills", `bill_${bill._id}.pdf`);
  const pdfDoc = new PDFDocument();

  pdfDoc.pipe(fs.createWriteStream(pdfPath));
  pdfDoc.text(`Monthly Billing Statement`, { align: "center" });
  pdfDoc.moveDown();

  pdfDoc.text(`Resident Name: ${bill.resident.name}`);
  pdfDoc.text(`Room Number: ${bill.room.roomNumber}`);
  pdfDoc.text(`Billing Period: ${bill.billingPeriod.startDate.toDateString()} - ${bill.billingPeriod.endDate.toDateString()}`);
  pdfDoc.text(`Due Date: ${bill.dueDate.toDateString()}`);
  pdfDoc.moveDown();

  pdfDoc.text(`Monthly Room Rate: ₹${bill.room.price.toFixed(2)}`);
  pdfDoc.text(`Service Charge: ₹${bill.serviceCharge.toFixed(2)}`);
  pdfDoc.text(`Amount Due: ₹${bill.amountDue.toFixed(2)}`);
  pdfDoc.text(`Late Fee: ₹${bill.lateFee.toFixed(2)}`);
  pdfDoc.text(`Payment Status: ${bill.paymentStatus}`);
  pdfDoc.moveDown();

  pdfDoc.end();
};

// Send bill PDF to resident via email
export const sendBillEmail = async (bill, email) => {
  const pdfPath = path.join("bills", `bill_${bill._id}.pdf`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your Monthly Billing Statement",
    text: "Please find attached your monthly billing statement.",
    attachments: [{ filename: `bill_${bill._id}.pdf`, path: pdfPath }],
  };

  await transporter.sendMail(mailOptions);
  console.log(`Bill sent to ${email}`);
};

// Generate monthly bills for all residents on the 2nd of every month
cron.schedule("0 0 2 * *", async () => {
  try {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), 15);

    const residents = await Resident.find().populate("room");
    for (const resident of residents) {
      await generateBill(resident, startDate, endDate, dueDate, 0); // Assuming no late fee initially
    }

    console.log("Monthly bills generated successfully");
  } catch (error) {
    console.error("Error generating monthly bills: ", error);
  }
});


// Record a payment for a bill
export const recordPayment = async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentDate, amount, paymentMethod, transactionId } = req.body;

    const bill = await Billing.findById(billId);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    bill.paymentHistory.push({ paymentDate, amount, paymentMethod, transactionId });
    bill.amountPaid += amount;

    // Update payment status based on total amount paid
    if (bill.amountPaid >= bill.amountDue) {
      bill.paymentStatus = "paid";
    } else if (bill.amountPaid > 0) {
      bill.paymentStatus = "partially paid";
    }

    await bill.save();
    res.status(200).json({ message: "Payment recorded successfully", bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};