import Billing from "../Models/billingSchema.js";
import RevenueExpenseRecord from "../Models/revenueExpenseSchema.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import { Parser } from "json2csv";
import Room from "../Models/roomSchema.js";

// Generate PDF for Billing Report (using PDFKit)
export const generateBillingReportPDF = async (req, res) => {
  const { month } = req.params;
  
  try {
    const bills = await Billing.find({ month });
    if (!bills || bills.length === 0) {
      return res.status(404).json({ message: "No billing records found for this month" });
    }

    // Create a PDF document
    const doc = new PDFDocument();
    const filePath = `./reports/billing_report_${month}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(16).text(`Billing Report for ${month}`, { align: 'center' });
    doc.moveDown();
    
    bills.forEach(bill => {
      doc.fontSize(12).text(`Billing ID: ${bill._id}`, { align: 'left' });
      doc.text(`Amount: ${bill.amount}`, { align: 'left' });
      doc.text(`Payment Status: ${bill.paymentStatus}`, { align: 'left' });
      doc.moveDown();
    });

    doc.end();

    // Send file path for download or processing
    res.status(200).json({
      message: "Billing report PDF generated successfully",
      reportPath: filePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating billing report PDF" });
  }
};

// Download financial report (revenue/expenses) for a given period
export const downloadFinancialReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    // Fetch revenue and expense records between startDate and endDate
    const records = await RevenueExpenseRecord.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No revenue/expense records found for this period" });
    }

    // Convert the records to CSV format using json2csv
    const parser = new Parser();
    const csv = parser.parse(records);

    // Generate CSV report
    const csvFilePath = `./reports/financial_report_${startDate}_${endDate}.csv`;
    fs.writeFileSync(csvFilePath, csv);

    // Create a PDF report for financial data
    const pdfFilePath = `./reports/financial_report_${startDate}_${endDate}.pdf`;
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfFilePath));

    doc.fontSize(16).text(`Financial Report from ${startDate} to ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Add each record to the PDF
    records.forEach(record => {
      doc.fontSize(12).text(`Record ID: ${record._id}`, { align: 'left' });
      doc.text(`Amount: ${record.amount}`, { align: 'left' });
      doc.text(`Type: ${record.type}`, { align: 'left' });
      doc.text(`Date: ${record.date.toISOString().split('T')[0]}`, { align: 'left' });
      doc.moveDown();
    });

    doc.end();

    // Send both CSV and PDF paths
    res.status(200).json({
      message: "Financial report generated successfully",
      csvReportPath: csvFilePath,
      pdfReportPath: pdfFilePath,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating financial report" });
  }
};


// Function to calculate the occupancy rate of a room
export const getRoomOccupancyRate = async (req, res) => {
  const { roomNumber } = req.params; // Room number passed in the URL
  
  try {
    // Find the room by room number
    const room = await Room.findOne({ roomNumber });
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Calculate occupancy rate
    const totalResidents = room.residents.length;
    const roomCapacity = room.capacity;
    
    if (roomCapacity === 0) {
      return res.status(400).json({ message: "Room capacity cannot be zero" });
    }

    // Occupancy rate in percentage
    const occupancyRate = (totalResidents / roomCapacity) * 100;

    // Send response with occupancy rate
    res.status(200).json({
      message: `Occupancy rate for room ${roomNumber}`,
      occupancyRate: occupancyRate.toFixed(2) // Limit to 2 decimal places
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error calculating occupancy rate" });
  }
};