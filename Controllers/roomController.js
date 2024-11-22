import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// View all rooms with resident details
export const getRoomsWithResidents = async (req, res) => {
  try {
    const rooms = await Room.find().populate("resident",  "name, email, phoneNumber, emergencyContact, -password");
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms with resident details",
      error: error.message,
    });
  }
};


/* get all rooms */
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().select("-residentHistory");
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms",
      error: error.message,
    });
  }
}

// Assign room to a resident
export const assignRoomToResident = async (req, res) => {
  const { roomNumber, residentId } = req.body;

  if (!roomNumber || !residentId) {
    return res.status(400).json({
      success: false,
      message: "Room number and resident ID are required",
    });
  }

  try {
    const room = await Room.findOne({ roomNumber });
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });

    const resident = await Resident.findById(residentId);
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

    if (!room.isAvailable) {
      return res.status(400).json({ success: false, message: "Room is already assigned" });
    }

    if (resident.room) {
      return res.status(400).json({
        success: false,
        message: "Resident already has an assigned room",
      });
    }

    room.resident = residentId;
    room.bedRemaining = room.capcity - room.residents;
    room.isAvailable = false;
    await room.save();

    resident.room = room._id;
    await resident.save();

    res.status(200).json({ success: true, message: "Room assigned successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign room",
      error: error.message,
    });
  }
};

// Update room availability
export const updateRoomAvailability = async (req, res) => {
  const { roomNumber, availability } = req.body;

  if (!roomNumber || availability === undefined) {
    return res.status(400).json({
      success: false,
      message: "Room number and availability status are required",
    });
  }

  try {
    const room = await Room.findOne({ roomNumber });
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });

    room.isAvailable = availability;

    if (availability) {
      room.resident = null; // Clear resident when marking room available
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: "Room availability updated successfully",
      data: room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update room availability",
      error: error.message,
    });
  }
};

// Add a new room (Admin only)
export const addRoom = async (req, res) => {
  const { roomNumber, roomType, price, isAvailable, amenities } = req.body;

  if (!roomNumber || !roomType || !price || !amenities) {
    return res.status(400).json({
      success: false,
      message: "Room number, room type, and price are required",
    });
  }

  try {
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
    }

    const newRoom = new Room({
      roomNumber,
      roomType,
      price,
      amenities,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    await newRoom.save();
    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: newRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding new room",
      error: error.message,
    });
  }
};

// Fetch available rooms
export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true });
    res.status(200).json({
      success: true,
      message: "Available rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch available rooms",
      error: error.message,
    });
  }
};
