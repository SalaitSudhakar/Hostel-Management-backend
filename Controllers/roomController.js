import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";

// View all rooms with resident details
export const getRoomsWithResidents = async (req, res) => {
  try {
    const rooms = await Room.find().populate("resident");
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms and resident details" });
  }
};

// Assign room to resident
export const assignRoomToResident = async (req, res) => {
  try {
      const { roomId, residentId } = req.body;

      const room = await Room.findById(roomId);
      const resident = await Resident.findById(residentId);

      if (!room || !resident) {
          return res.status(404).json({ message: 'Room or Resident not found' });
      }

      room.residentId = residentId;
      room.availability = false; // Mark room as unavailable
      await room.save();

      resident.roomId = roomId;
      await resident.save();

      res.status(200).json({ message: 'Room assigned to resident successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Failed to assign room', error });
  }
};


// Update room availability
export const updateRoomAvailability = async (req, res) => {
  try {
      const { roomId, availability } = req.body;

      const room = await Room.findById(roomId);
      if (!room) {
          return res.status(404).json({ message: 'Room not found' });
      }

      room.isAvailable = availability; // Update availability status
      await room.save();
      res.status(200).json({ message: 'Room availability updated', room });
  } catch (error) {
      res.status(500).json({ message: 'Failed to update room availability', error });
  }
};


// Add a new room (Admin only)
export const addRoom = async (req, res) => {
  const { roomNumber, price, availability } = req.body;

  try {
    const newRoom = new Room({ roomNumber, price, isAvailable: availability });
    await newRoom.save();
    res.status(201).json({ message: "Room added successfully", room: newRoom });
  } catch (error) {
    res.status(500).json({ message: "Error adding new room" });
  }
};


// Fetch available rooms
export const getAvailableRooms = async (req, res) => {
  try {
      const rooms = await Room.find({ isAvailable: true });
      res.status(200).json({ rooms });
  } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rooms', error });
  }
};