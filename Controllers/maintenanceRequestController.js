import MaintanenceRequest from "../Models/maintanenceRequestSchema.js";
import Resident from "../Models/residentSchema.js";
import User from "../Models/userSchema.js";

// Create a new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { room, resident, description, priorityLevel } = req.body;

    // Validate if resident and room exist
    const foundResident = await Resident.findById(resident);
    if (!foundResident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const foundRoom = foundResident.room.find(r => r._id.toString() === room);
    if (!foundRoom) {
      return res.status(404).json({ message: "Room not found for this resident" });
    }

    const newRequest = new MaintanenceRequest({
      room,
      resident,
      description,
      priorityLevel,
    });

    await newRequest.save();
    res.status(201).json({ message: "Maintenance request created", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all maintenance requests (filter by resident, room, or status)
export const getMaintenanceRequests = async (req, res) => {
  try {
    const { status, residentId, roomId } = req.query;

    // Build the query filter based on parameters
    let filter = {};
    if (status) filter.status = status;
    if (residentId) filter.resident = residentId;
    if (roomId) filter.room = roomId;

    const requests = await MaintanenceRequest.find(filter).populate("room resident assignStaff");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update the status of a maintenance request (e.g., mark as resolved)
export const updateMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, assignStaff } = req.body;

    // Validate that the request exists
    const request = await MaintanenceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    // Update the status and assign staff if provided
    if (status) request.status = status;
    if (assignStaff) {
      const staffMember = await User.findById(assignStaff);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      request.assignStaff = staffMember._id;
    }

    // If the status is resolved, set the resolvedAt timestamp
    if (request.status === "resolved" && !request.resolvedAt) {
      request.resolvedAt = new Date();
    }

    await request.save();
    res.status(200).json({ message: "Maintenance request updated", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a maintenance request
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find and delete the maintenance request
    const request = await MaintanenceRequest.findByIdAndDelete(requestId);
    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    res.status(200).json({ message: "Maintenance request deleted", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate the service charge based on maintenance requests
export const calculateServiceCharge = async (residentId, startDate, endDate) => {
  try {
    // Find maintenance requests for the resident within the specified date range
    const requests = await MaintanenceRequest.find({
      resident: residentId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: "resolved", // Only count resolved requests for the service charge
    });

    let serviceCharge = 0;
    requests.forEach((request) => {
      // Service charge logic can be based on priority or complexity of the request
      if (request.priorityLevel === "high") {
        serviceCharge += 100; // Example: high priority requests may cost more
      } else if (request.priorityLevel === "medium") {
        serviceCharge += 50; // Example: medium priority requests may cost less
      } else {
        serviceCharge += 20; // Example: low priority requests have the lowest cost
      }
    });

    return serviceCharge;
  } catch (error) {
    throw new Error(`Error calculating service charge: ${error.message}`);
  }
};
