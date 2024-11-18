import MaintenanceRequest from "../Models/maintenanceRequestSchema.js";
import Resident from "../Models/residentSchema.js";
import sendEmail from "../Utils/mailer.js"; 

// Create a new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  const { residentId, issue, priority } = req.body;

  try {
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const maintenanceRequest = new MaintenanceRequest({
      resident: residentId,
      issue,
      priority,
      status: "Pending",
      createdAt: new Date(),
    });

    await maintenanceRequest.save();

    // Send email notification
    const to = resident.email;
    const subject = "Maintenance Request";
    const text = `Resident: ${resident.name}\nIssue: ${issue}\nPriority: ${priority}\nStatus: ${maintenanceRequest.status}`;

    await sendEmail(to, subject, text);

    res.status(201).json({ message: "Maintenance request created successfully", maintenanceRequest });
  } catch (error) {
    res.status(500).json({ message: "Error creating maintenance request" });
  }
};

// Get all maintenance requests
export const getAllMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find().populate("resident");
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching maintenance requests" });
  }
};

// Update maintenance request status (Admin only)
export const updateMaintenanceRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { staff } = req.body;

  try {
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.assignedTo = staff;
    request.status = "In Progess";
    await request.save();

    //send Email
    const to = request.resident.email;
    const subject = "Maintenance Request Update";
    const text = `Staff has been assigned to solve the issue\n Resident: ${request.resident.name}\nIssue: ${request.issue}\nPriority: ${request.priority}\nStatus: ${request.status}`;

    await sendEmail(to, subject, text);

    res.status(200).json({ message: "Maintenance request updated successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Error updating maintenance request" });
  }
};

export const resolveMaintenanceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be resolved" });
    }
    request.status = "Resolved";
    await request.save();
    res.status(200).json({ message: "Maintenance request resolved successfully", request });
  } catch (error) {
    res.status(500).json({ message: "Error resolving maintenance request" });
  }   
}


export const deleteMaintenanceRequest = async (req, res) => { 
  try {
    const { requestId } = req.params;
    const request = await MaintenanceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status === "Resolved") {
      return res.status(400).json({ message: "Only pending requests can be deleted" });
    }
    await MaintenanceRequest.findByIdAndDelete();
    res.status(200).json({ message: "Maintenance request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting maintenance request" });
  }
};

