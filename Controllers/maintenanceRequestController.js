import MaintenanceRequest from "../Models/maintenanceRequestSchema.js";
import Resident from "../Models/residentSchema.js";
import sendEmail from "../Utils/mailer.js";

// Create a new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  const { residentId, roomId, issueTitle, issueDescription, priority } =
    req.body;

  try {
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const maintenanceRequest = new MaintenanceRequest({
      resident: residentId,
      room: roomId,
      issueTitle,
      issueDescription,
      priority,
      status: "Pending",
    });

    await maintenanceRequest.save();

    // Send email notification
    const to = resident.email;
    const subject = "New Maintenance Request";
    const text = `Dear ${resident.name},\n\nYour maintenance request has been created successfully.\n\nIssue: ${issueTitle}\nPriority: ${priority}\nStatus: Pending\n\nOur team will attend to your request soon.\n\nThank you!`;

    await sendEmail(to, subject, text);

    res.status(201).json({
      message: "Maintenance request created successfully",
      data: maintenanceRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating maintenance request" });
  }
};

// Get all maintenance requests
export const getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find()
      .populate("resident", "name email")
      .populate("room", "roomNumber")
      .populate("assignedTo", "name email");
    res.status(200).json({message: "Maintenance requests fetched successfully", data: requests});
  } catch (error) {
    res.status(500).json({ message: "Error fetching maintenance requests" });
  }
};

// Update maintenance request status (Admin only)
export const updateMaintenanceRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { staffId } = req.body;

  try {
    const request = await MaintenanceRequest.findById(requestId)
    .populate("resident")
    .populate("room");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.assignedTo = staffId;
    request.status = "In Progress";
    await request.save();

    // Send email notification
    const to = request.resident.email;
    const subject = "Maintenance Request Update";
    const text = `Dear ${request.resident.name},\n\nYour maintenance request has been updated.\n\nIssue: ${request.issueDescription}\nPriority: ${request.priority}\nStatus: In Progress\n\nOur staff will attend to your request soon.\n\nThank you!`;

    await sendEmail(to, subject, text);

    res
      .status(200)
      .json({ message: "Maintenance request updated successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Error updating maintenance request" });
  }
};

// Resolve a maintenance request (Staff only)
export const resolveMaintenanceRequest = async (req, res) => {
  const { requestId } = req.body; // Get requestId from the request body

  try {
    const request = await MaintenanceRequest.findById(requestId).populate(
      "resident"
    )
    .populate("room");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "Resolved") {
      return res.status(400).json({ message: "Request is already resolved" });
    }

    request.status = "Resolved";
    await request.save();

    // Send gratitude email
    const to = request.resident.email;
    const subject = "Maintenance Request Resolved";
    const text = `Dear ${request.resident.name},\n\nWe are happy to inform you that your maintenance request has been resolved.\n\nIssue: ${request.issueDescription}\nRoom: ${request.room}\n\nWe appreciate your patience and understanding. Please let us know if you face any further issues.\n\nThank you for trusting our services.\n\nBest regards,\nThe Maintenance Team`;

    await sendEmail(to, subject, text);

    res
      .status(200)
      .json({ message: "Maintenance request resolved successfully", data: request });
  } catch (error) {
    res.status(500).json({ message: "Error resolving maintenance request" });
  }
};

// Delete a maintenance request (Admin only)
export const deleteMaintenanceRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "Resolved") {
      return res
        .status(400)
        .json({ message: "Resolved requests cannot be deleted" });
    }

    await MaintenanceRequest.findByIdAndDelete(requestId);
    res
      .status(200)
      .json({ message: "Maintenance request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting maintenance request" });
  }
};
