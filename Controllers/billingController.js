import Billing from "../Models/billingSchema.js";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// Create a new bill for a resident
export const createBilling = async (req, res) => {
  const { residentId, roomId, amountDue, dueDate, serviceCharge, lateFee } = req.body;

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
      amountDue,
      dueDate,
      serviceCharge,
      lateFee,
      paymentStatus: "unpaid", // Default status
      refundStatus: "none",    // Default refund status
    });

    await billingRecord.save();
    res.status(201).json({ message: "Billing created successfully", billingRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating billing record" });
  }
};

// Get all billing records (Admin only)
export const getAllBillingRecords = async (req, res) => {
  try {
    const billingRecords = await Billing.find().populate("resident room");
    res.status(200).json(billingRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching billing records" });
  }
};



// Get a specific resident's billing records
export const getResidentBillingRecords = async (req, res) => {
  const { residentId } = req.params;

  try {
    const billingRecords = await Billing.find({ resident: residentId }).populate("resident room");
    if (!billingRecords) {
      return res.status(404).json({ message: "No billing records found for this resident" });
    }
    res.status(200).json(billingRecords);
  } catch (error) {
    console.error(error);
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

    billingRecord.paymentStatus = status;
    await billingRecord.save();

    res.status(200).json({ message: "Billing status updated successfully", billingRecord });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: "Error deleting billing record" });
  }
};

/* // Update billing refund details
export const initiateRefund = async (req, res) => {
  const { billingId, refundAmount } = req.body;

  try {
    const billingRecord = await Billing.findById(billingId);
    if (!billingRecord) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    if (billingRecord.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Cannot refund an unpaid bill" });
    }

    if (billingRecord.refundStatus === "completed") {
      return res.status(400).json({ message: "Refund already completed" });
    }

    // Ensure refundAmount does not exceed the amount paid
    if (refundAmount > billingRecord.amountPaid) {
      return res.status(400).json({ message: "Refund amount exceeds the paid amount" });
    }

    billingRecord.refundAmount = refundAmount;
    billingRecord.refundStatus = "initiated";
    await billingRecord.save();

    res.status(200).json({ message: "Refund initiated successfully", billingRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error initiating refund" });
  }
};

// Complete refund process
export const completeRefund = async (req, res) => {
  const { billingId } = req.params;

  try {
    const billingRecord = await Billing.findById(billingId);
    if (!billingRecord) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    if (billingRecord.refundStatus !== "initiated") {
      return res.status(400).json({ message: "Refund is not initiated" });
    }

    billingRecord.refundStatus = "completed";
    await billingRecord.save();

    res.status(200).json({ message: "Refund completed successfully", billingRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error completing refund" });
  }
};
 */