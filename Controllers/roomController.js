import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// View all rooms with resident details
export const getRoomsWithResidents = async (req, res) => {
  try {
    const rooms = await Room.find().populate("resident",  "name, email, phoneNumber, emergencyContact");
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

    room.residents.push(residentId);
    room.bedRemaining = room.capacity - room.residents.length;
    if (room.bedRemaining === 0) {
      room.isAvailable = false;
    };
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


// Add a new room (Admin only)
export const createRoom = async (req, res) => {
  const { roomNumber, roomType, price, capacity, amenities, roomDescription, discount } = req.body;
 
  console.log(req.body)
  let imageUrls = [];

  // Handle image upload (if file uploaded)
if (req.files && req.files.length > 0) {
  req.files.forEach((file) => {
    imageUrls.push(file.path);  // Push each image's path to imageUrls array
  });
}

  if (!roomNumber || !roomType || !price || !amenities || !capacity || !roomDescription || !discount) { 
      console.log("Room number, room type, and price, capacity, amenities, roomDescription, discount are required")
      return res.status(400).json({
      success: false,
      message: "Room number, room type, and price, capacity, amenities, roomDescription, discount are required",
    });
  }

  try {
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      console.log("ROom Number already exists");
      return res.status(400).json({
          
        success: false,
        message: "Room number already exists",
      });
    }

    const newRoom = new Room({
    roomNumber,
    roomType,
    price,
    capacity,
    amenities: amenities.split(","),
    roomDescription,
    discount,
    images: imageUrls,
    isAvailable: true, // Initially available
    roomStatus: "Available",
    isAvailable: true,
    bedRemaining: capacity,
    });

    await newRoom.save();
    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: newRoom,
    });
  } catch (error) {
      console.log(error)
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
