import mongoose from "mongoose";
import Booking from "../Models/bookingSchema.js";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";
import sendEmail from "../Utils/mailer.js";
import MaintenanceRequest from "../Models/maintenanceRequestSchema.js";

// Helper function to validate booking dates
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Set to midnight
  return d;
};

const validateBookingDates = (checkInDate, checkOutDate) => {
  checkInDate = normalizeDate(checkInDate);
  checkOutDate = normalizeDate(checkOutDate);
  return (
    checkInDate instanceof Date &&
    checkOutDate instanceof Date &&
    checkInDate < checkOutDate &&
    checkInDate >= new Date() // Ensure the date is not in the past
  );
};

const getMaintenanceCharge = async (req) => {
  const residentId = req.user._id;
  // Find the room's maintenance charge or calculate it based on other data
  const maintenanceRequest = await MaintenanceRequest.findOne({
    resident: residentId,
  });
  if (maintenanceRequest) {
    return maintenanceRequest.charge || 0; // Default to 0 if no charge exists
  }
  return 0; // Default if no maintenance request is found
};

// Generate a unique booking reference
const generateBookingReference = () => {
  return `BOOK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Helper function to calculate the total price (mock implementation)
const calculateTotalPrice = async (
  room,
  totalNights,
  guests,
  maintenanceCharge
) => {
  const basePrice = room.price || 4000; // Default price if not set
  const totalRoomCost =
    basePrice *
    totalNights *
    (guests.adults + guests.children + guests.infantsUnder2);
  const tax = totalRoomCost * 0.18; // Assuming 18% GST
  const totalPrice = totalRoomCost + maintenanceCharge + tax;

  const priceBreakdown = {
    nights: totalNights,
    basePrice: room.price || basePrice,
    roomCost: totalRoomCost,
    maintenanceCharge,
    tax,
    totalPrice,
  };

  return { totalPrice, priceBreakdown };
};

// Create a new booking
// Create a new booking
export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, checkInDate, checkOutDate, guests } = req.body;

    // Validate required fields
    if (!roomId || !checkInDate || !checkOutDate || !guests) {
      console.log("Missing required booking details");
      return res
        .status(400)
        .json({ message: "Missing required booking details" });
    }

    // Parse and validate dates
    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);
    if (!validateBookingDates(parsedCheckIn, parsedCheckOut)) {
      console.log("Invalid booking dates");
      return res.status(400).json({ message: "Invalid booking dates" });
    }

    // Validate guest numbers
    if (
      !guests.adults ||
      guests.adults < 1 ||
      guests.children < 0 ||
      guests.infantsUnder2 < 0
    ) {
      console.log("Invalid guest numbers");
      return res.status(400).json({ message: "Invalid guest numbers" });
    }

    // Validate resident (assumes req.user._id comes from authentication middleware)
    const residentId = req.user.id;
    const resident = await Resident.findById(residentId).session(session);
    if (!resident) {
      console.log("Resident not found");
      return res.status(404).json({ message: "Resident not found" });
    }
    if (resident.room) {
      console.log("Resident already has a room");
      return res.status(400).json({ message: "Resident already has a room" });
    }

    // Find and validate room
    const room = await Room.findById(roomId).session(session);
    if (!room || !room.isAvailable || room.bedRemaining <= 0) {
      return res
        .status(404)
        .json({ message: "Room is not available or has no beds remaining" });
    }

    // Check for overlapping bookings only on check-in date
    const existingBookings = await Booking.find({
      room: roomId,
      bookingStatus: { $ne: "cancelled" },
      checkInDate: parsedCheckIn, // Match exactly on check-in date
    }).session(session);

    if (existingBookings.length >= room.bedRemaining) {
      return res
        .status(400)
        .json({ message: "Room is already booked for the check-in date" });
    }

    // Calculate total price
    const totalNights = Math.ceil(
      (parsedCheckOut.getTime() - parsedCheckIn.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const maintenanceCharge = await getMaintenanceCharge(req);
    const { totalPrice, priceBreakdown } = await calculateTotalPrice(
      room,
      totalNights,
      guests,
      maintenanceCharge
    );

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create a new booking
    const newBooking = new Booking({
      bookingReference,
      resident: residentId,
      room: roomId,
      checkInDate: parsedCheckIn,
      checkOutDate: parsedCheckOut,
      guests,
      numberOfRooms: 1,
      priceBreakdown: {
        basePrice: priceBreakdown.basePrice,
        roomCost: priceBreakdown.roomCost,
        maintenanceCharge,
        tax: priceBreakdown.tax,
        totalPrice: priceBreakdown.totalPrice,
      },
      bookingStatus: "pending",
      payment: { status: "pending" },
    });

    await newBooking.save({ session });

    // Update resident details
    resident.checkInDate = parsedCheckIn;
    resident.checkOutDate = parsedCheckOut;
    await resident.save({ session });

    // Update room details
    room.residents.push(residentId);
    room.isAvailable = room.bedRemaining > 0;
    room.roomStatus = "reserved";
    await room.save({ session });

    // Send confirmation email
    const subject = `Booking Confirmation - ${newBooking.bookingReference}`;
    const html = `
      <h1>Booking Confirmation</h1>
      <p>Booking Reference: ${newBooking.bookingReference}</p>
      <p>Total Price: $${priceBreakdown.totalPrice.toFixed(2)}</p>`;
    const text = `Booking Confirmation\nBooking Reference: ${
      newBooking.bookingReference
    }\nTotal Price: $${priceBreakdown.totalPrice.toFixed(2)}`;

    try {
      await sendEmail(resident.email, subject, html, text);
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Booking created successfully",
      booking: {
        id: newBooking._id,
        bookingReference: newBooking.bookingReference,
        totalPrice: priceBreakdown.totalPrice.toFixed(2),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Booking creation error:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

// Get booking by reference
export const getBookingByReference = async (req, res) => {
  const { reference } = req.params;

  try {
    const booking = await Booking.findOne({ bookingReference: reference });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking by reference:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reference } = req.params; // Booking reference


    // Find the booking
    const booking = await Booking.findOne({
      bookingReference: reference,
    }).session(session);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Find the resident
    const residentid =  booking.resident;
    const resident = await Resident.findById(residentid).session(session);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const roomId = booking.room; // ObjectId reference to Room

    // Find the room
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Update booking status to "cancelled"
    booking.bookingStatus = "cancelled";
    await booking.save({ session });

    // Update room availability
    const totalGuests =
      booking.guests.adults +
      booking.guests.children +
      booking.guests.infantsUnder2;
    room.bedRemaining += totalGuests;

    // Remove the resident from the room's `residents` array
    room.residents = room.residents.filter(
      (id) => id.toString() !== residentId.toString()
    );
    room.isAvailable = room.residents.length < room.capacity; // Set availability based on current residents
    await room.save({ session });

    // Remove the room reference in the resident's document (set to null)
    resident.room = null;
    await resident.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling booking:", error.message);
    return res.status(500).json({ message: error.message });
  }
};
