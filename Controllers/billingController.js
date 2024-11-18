import Billing from "../Models/billingSchema.js";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// Create a new bill for a resident
export const createBilling = async (req, res) => {
  const { residentId, roomId, amount, dueDate } = req.body;

  try {
    // Ensure resident and room exist
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const billingRecord = new Billing({
      resident: residentId,
      room: roomId,
      amount,
      dueDate,
      status: "Unpaid",
      createdAt: new Date(),
    });

    await billingRecord.save();
    res.status(201).json({ message: "Billing created successfully", billingRecord });
  } catch (error) {
    res.status(500).json({ message: "Error creating billing record" });
  }
};

// Get all billing records (Admin only)
export const getAllBillingRecords = async (req, res) => {
  try {
    const billingRecords = await Billing.find().populate("resident room");
    res.status(200).json(billingRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching billing records" });
  }
};

// Get a specific resident's billing records
export const getResidentBillingRecords = async (req, res) => {
  const { residentId } = req.params;

  try {
    const billingRecords = await Billing.find({ resident: residentId }).populate("resident room");
    res.status(200).json(billingRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resident's billing records" });
  }
};

// Update billing status (e.g., Mark as Paid or Unpaid)
export const updateBillingStatus = async (req, res) => {
  const { billingId } = req.params;
  const { status } = req.body;

  try {
    const billingRecord = await Billing.findById(billingId);
    if (!billingRecord) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    billingRecord.status = status;
    await billingRecord.save();

    res.status(200).json({ message: "Billing status updated successfully", billingRecord });
  } catch (error) {
    res.status(500).json({ message: "Error updating billing status" });
  }
};

// Delete a billing record (Admin only)
export const deleteBillingRecord = async (req, res) => {
  const { billingId } = req.params;

  try {
    const billingRecord = await Billing.findById(billingId);
    if (!billingRecord) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    await billingRecord.remove();
    res.status(200).json({ message: "Billing record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting billing record" });
  }
};