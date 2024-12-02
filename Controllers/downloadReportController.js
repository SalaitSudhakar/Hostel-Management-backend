// controllers/downloadController.js
import Expense from '../Models/expenseSchema.js';
import Booking from '../Models/bookingSchema.js';
import Room from '../Models/roomSchema.js';
import createPdf from '../utils/createPdf.js';  // Utility for creating PDF

// Helper function to calculate Revenue
const calculateRevenue = async (startDate, endDate) => {
  try {
    const revenue = await Booking.aggregate([
      {
        $match: {
          "bookingStatus": "confirmed",  // Only consider completed bookings
          "payment.status": "paid",  // Only count paid bookings
          checkInDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$priceBreakdown.totalPrice" },
        },
      },
    ]);
    return revenue[0]?.totalRevenue || 0;
  } catch (error) {
    console.error("Error calculating revenue:", error);
    return 0;
  }
};

// Helper function to calculate Room Occupancy Rate
const calculateRoomOccupancyRate = async (startDate, endDate) => {
  try {
    const roomStats = await Room.aggregate([
      {
        $match: {
          "bookingDates.startDate": {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$bookingDates", // Flatten the bookingDates array to group by individual dates
      },
      {
        $match: {
          "bookingDates.startDate": {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: "$bookingDates.startDate",  // Group by the startDate field
          totalRooms: { $sum: 1 },
          occupiedRooms: {
            $sum: {
              $cond: [{ $eq: ["$roomStatus", "Occupied"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // If roomStats is empty, return 0, otherwise calculate occupancy rate
    const occupancyRate = roomStats.length > 0
      ? (roomStats[0].occupiedRooms / roomStats[0].totalRooms) * 100
      : 0;

    return occupancyRate; // Return occupancy rate as a percentage
  } catch (error) {
    console.error("Error calculating room occupancy rate:", error);
    return 0;
  }
};


// Download Expense Report
export const downloadExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch expenses based on date range
    const expenses = await Expense.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Generate styled PDF for the expense report
    const pdfBuffer = await createPdf('expense', expenses);

    // Set headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="expense-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading the expense report', error });
  }
};

// Download Revenue Report
export const downloadRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Calculate revenue
    const revenue = await calculateRevenue(startDate, endDate);

    // Generate styled PDF for revenue report
    const pdfBuffer = await createPdf('revenue', [{ revenue }]);

    // Set headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading the revenue report', error });
  }
};


// Download Room Occupancy Report
export const downloadRoomOccupancyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Calculate room occupancy rate
    const occupancyRate = await calculateRoomOccupancyRate(startDate, endDate);

    // Generate styled PDF for room occupancy report
    const pdfBuffer = await createPdf('roomOccupancy', [{ occupancyRate }]);

    // Set headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="room-occupancy-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading the room occupancy report', error });
  }
};