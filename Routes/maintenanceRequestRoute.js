import express from "express";
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from "../Controllers/maintenanceRequestController.js";

const router = express.Router();

// Route to create a new maintenance request
router.post("/", createMaintenanceRequest);

// Route to get all maintenance requests (with optional filtering)
router.get("/", getMaintenanceRequests);

// Route to update an existing maintenance request (status, assign staff)
router.patch("/:requestId", updateMaintenanceRequest);

// Route to delete a maintenance request
router.delete("/:requestId", deleteMaintenanceRequest);

export default router;