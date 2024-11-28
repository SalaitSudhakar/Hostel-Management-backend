import mongoose from "mongoose";
import Booking from "../Models/bookingSchema.js";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";
import sendEmail from "../Utils/mailer.js";
import MaintenanceRequest from "../Models/maintenanceRequestSchema.js";

// Helper function to validate booking dates
const validateBookingDates = (checkInDate, checkOutDate) => {
  return (
    checkInDate instanceof Date &&
    checkOutDate instanceof Date &&
    checkInDate < checkOutDate &&
    checkInDate >= new Date()
  );
};

const getMaintenanceCharge = async () => {
  const residentId = req.user._id;
  // Find the room's maintenance charge or calculate it based on other data
  const maintenanceRequest = await MaintenanceRequest.findOne({ resident: residentId });
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
const calculateTotalPrice = async (room, totalNights, guests, maintenanceCharge) => {
  const basePrice = room.price || 4000; // Default price if not set
  const totalRoomCost = basePrice * totalNights;
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
export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, checkInDate, checkOutDate, guests } = req.body;

    // Validate required fields
    if (!roomId || !checkInDate || !checkOutDate || !guests) {
      throw new Error("Missing required booking details");
    }

    // Parse and validate dates
    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);
    if (!validateBookingDates(parsedCheckIn, parsedCheckOut)) {
      throw new Error("Invalid booking dates");
    }

    // Validate guest numbers
    if (!guests.adults || guests.adults < 1 || guests.children < 0 || guests.infantsUnder2 < 0) {
      throw new Error("Invalid guest numbers");
    }

    // Validate resident (assumes req.user._id comes from authentication middleware)
    const residentId = req.user._id;
    const resident = await Resident.findById(residentId).session(session);
    if (!resident) {
      throw new Error("Resident not found");
    }

    // Find and validate room
    const room = await Room.findById(roomId).session(session);
    if (!room || !room.isAvailable || room.bedRemaining <= 0) {
      throw new Error("Room is not available or has no beds remaining");
    }

    // Check for overlapping bookings
    const existingBookings = await Booking.find({
      room: roomId,
      bookingStatus: { $ne: "cancelled" },
      $or: [
        {
          checkInDate: { $lt: parsedCheckOut },
          checkOutDate: { $gt: parsedCheckIn },
        },
      ],
    }).session(session);

    if (existingBookings.length > 0) {
      throw new Error("Room is not available for the selected dates");
    }

    // Calculate total price
    const totalNights = Math.ceil(
      (parsedCheckOut.getTime() - parsedCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );
      // Fetch the maintenance charge
    const maintenanceCharge = await getMaintenanceCharge();
    const { totalPrice, priceBreakdown } = await calculateTotalPrice(room, totalNights, guests, maintenanceCharge);

     

     // Add maintenance charge to the total price
     const finalTotalPrice = totalPrice + maintenanceCharge;
     
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
        totalPrice: finalTotalPrice,
      },
      bookingStatus: "pending",
      payment: { status: "pending" },
    });

    await newBooking.save({ session });

    // update resident details
    resident.room = roomId; 
    resident.status = "resident";
    resident.checkInDate = parsedCheckIn; 
    resident.checkOutDate = parsedCheckOut;

    await resident.save({ session });
    // Update room details
    const totalGuests = guests.adults + guests.children + guests.infantsUnder2;
    room.bedRemaining -= totalGuests;
    room.status = 'reserved'
    room.isAvailable = room.bedRemaining > 0;
    await room.save({ session });

    // Send confirmation email
    const subject = `Booking Confirmation - ${newBooking.bookingReference}`;
    const html = `
      <h1>Booking Confirmation</h1>
      <p>Booking Reference: ${newBooking.bookingReference}</p>
      <p>Total Price: $${newBooking.totalPrice.toFixed(2)}</p>`;
    const text = `Booking Confirmation\nBooking Reference: ${newBooking.bookingReference}\nTotal Price: $${newBooking.totalPrice.toFixed(2)}`;

    try {
      await sendEmail(resident.email, subject, html, text);
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
      // Do not fail the booking process if email fails
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Booking created successfully",
      booking: {
        id: newBooking._id,
        bookingReference: newBooking.bookingReference,
        totalPrice: newBooking.totalPrice,
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reference } = req.params;

    // Find booking
    const booking = await Booking.findOne({ bookingReference: reference }).session(session);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.bookingStatus === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    // Update booking status
    booking.bookingStatus = "cancelled";
    await booking.save({ session });

    // Update room availability
    const room = await Room.findById(booking.room).session(session);
    if (room) {
      const totalGuests = booking.guests.adults + booking.guests.children + booking.guests.infantsUnder2;
      room.bedRemaining += totalGuests;
      room.isAvailable = true;
      await room.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling booking:", error.message);
    return res.status(400).json({ message: error.message });
  }
};
