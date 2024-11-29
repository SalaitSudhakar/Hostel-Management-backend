import express from "express";
import {createBooking, cancelBooking, getBookingByReference} from "../Controllers/bookingController.js";
import {
  authMiddleware,
  roleMiddleware
} from "../Middlewares/authMiddleware.js";

const router = express.Router();

// Create a new booking
router.post("/create", authMiddleware, roleMiddleware(["resident"]), createBooking);

// Get booking by reference
router.get(
  "/:reference",
  authMiddleware,
  roleMiddleware(["admin"]),
  getBookingByReference
);

// Cancel booking
router.patch(
  "/cancel/:reference",
  authMiddleware,
  roleMiddleware(["resident"]),
  cancelBooking
);

export default router;
