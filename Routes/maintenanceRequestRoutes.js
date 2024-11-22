import express from "express";
import {
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  updateMaintenanceRequestStatus,
  resolveMaintenanceRequest,
  deleteMaintenanceRequest,
} from "../Controllers/maintenanceRequestController.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Create a new maintenance request (Resident)
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("resident"), // Only residents can create requests
  createMaintenanceRequest
);

// Get all maintenance requests (Admin/Staff)
router.get(
  "/get",
  authMiddleware,
  roleMiddleware("admin", "staff"), 
  getAllMaintenanceRequests
);

// Update a maintenance request (Assign to staff - Admin only)
router.patch(
  "/update/:id",
  authMiddleware,
  roleMiddleware("admin"), // Only admins can assign staff
  updateMaintenanceRequestStatus
);

// Resolve a maintenance request (Staff)
router.post(
  "/resolve",
  authMiddleware,
  roleMiddleware("staff"), // Only staff can resolve requests
  resolveMaintenanceRequest
);

// Delete a maintenance request (Admin)
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware("admin"), // Only admins can delete requests
  deleteMaintenanceRequest
);

export default router;