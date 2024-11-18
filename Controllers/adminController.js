import Billing from "../Models/billingSchema.js";
import Room from "../Models/roomSchema.js";

// Get financial reports
export const getFinancialReports = async (req, res) => {
  try {
    // Example: Get all billing records (revenue)
    const bills = await Billing.find();
    const totalRevenue = bills.reduce((acc, bill) => acc + bill.amount, 0);
    res.status(200).json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ message: "Error generating financial reports" });
  }
};

// View all rooms with resident details
export const getRoomsWithResidents = async (req, res) => {
  try {
    const rooms = await Room.find().populate("resident");
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms and resident details" });
  }
};

// Add a new room (Admin only)
export const addRoom = async (req, res) => {
  const { roomNumber, price, availability } = req.body;

  try {
    const newRoom = new Room({ roomNumber, price, availability });
    await newRoom.save();
    res.status(201).json({ message: "Room added successfully", room: newRoom });
  } catch (error) {
    res.status(500).json({ message: "Error adding new room" });
  }
};

// Register a new revenue/expense record (Admin only)
export const registerRevenueExpense = async (req, res) => {
  const { type, amount, date, description } = req.body;

  try {
    const newRecord = new RevenueExpenseRecord({ type, amount, date, description });
    await newRecord.save();
    res.status(201).json({ message: "Revenue/Expense record added successfully", record: newRecord });
  } catch (error) {
    res.status(500).json({ message: "Error registering revenue/expense" });
  }
};
