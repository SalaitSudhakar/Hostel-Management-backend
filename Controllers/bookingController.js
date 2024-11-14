import Resident from "../Models/residentSchema.js";
import RoomOccupancy from "../Models/roomOccupancySchema.js";
import Room from "../Models/roomSchema.js";

// Create Resident
export const bookARoom = async (req, res) => {
  try {
    // get room id and check-in date from front end
    const { roomId, checkInDate } = req.body;

    // get user id from middleware
    const userId = req.user._id;

    // check if room id and check-in date is empty
    if (!roomId || !checkInDate) {
      return res
        .status(400)
        .json({ message: "Room Id and check-in date cannot empty" });
    }

    // if room id and check-in date is not empty
    // check if room id is valid
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // if room id is valid
    // check if room is available
    if (!room.isAvailable) {
      return res.status(400).json({ message: "Room is not available" });
    }

    // if room is available
    // check if check-in date is valid
    const today = new Date();
    today.setHours(0, 0, 0, 0); // set today's date to midnight
    const checkInDateObj = new Date(checkInDate);
    checkInDateObj.setHours(0, 0, 0, 0); // set check-in date to midnight
    if (checkInDateObj < today) {
      return res
        .status(400)
        .json({ message: "Check-in date cannot be in the past" });
    }

    // if check-in date is valid
    // check if room capacity is full
    if (room.currentOccupantCount === room.capacity) {
      return res.status(400).json({ message: "Room is full" });
    }

    // if room capacity is not full
    // check if user is already a resident of the room
    const isResident = await Resident.findOne({ user: userId, room: roomId });
    if (isResident) {
      return res
        .status(400)
        .json({ message: "User is already a resident of the room" });
    }

    // Create a new resident
    const newResident = new Resident({
      user: userId,
      room: roomId,
      checkInDate: checkInDateObj,
      billingStatus: "unpaid",
    });
    await newResident.save();

     // Create a new room occupancy entry
     const newRoomOccupancy = new RoomOccupancy({
      room: roomId,
      residents: [userId],
      checkInDate: checkInDateObj,
      checkOutDate: null, // Set later when they check out
      status: "active", // Initial status when booked
    });

    await newRoomOccupancy.save();

    // Save the room data after updating residents
    room.currentOccupantCount += 1;
    room.isAvailable = room.currentOccupantCount < room.capacity;
    await room.save();

    res.status(200).json({ message: "Room Booked Successfully", data: room, availableBeds: room.capacity - room.currentOccupantCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get all residents: admin only
export const getAllResidents = async (req, res) => {
  try {
    const residents = await Resident.find()
      .populate("user", "-password") // Exclude password from user data
      .populate({
        path: "room",
        select: "roomNumber", // Only include roomNumber in the populated room data
      });

    res.status(200).json({ message: "Residents Fetched Successfully", data: residents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Check out a resident: 
export const checkOutResident = async (req, res) => {
  try {
    const { id } = req.params; // Resident ID
    const { checkOutDate } = req.body;

    if (!checkOutDate) {
      return res.status(400).json({ message: "Check-out date is required" });
    }

    const resident = await Resident.findById(id);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const room = await Room.findById(resident.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (resident.checkOutDate) {
      return res.status(400).json({ message: "Resident already checked out" });
    }

    room.currentOccupantCount -= 1;
    room.isAvailable = room.currentOccupantCount < room.capacity;

    resident.checkOutDate = new Date(checkOutDate);

    await resident.save();
    await room.save();

    // Update RoomOccupancy record
    await RoomOccupancy.findOneAndUpdate(
      { room: room._id, residents: resident.user, status: "active" },
      { checkOutDate: resident.checkOutDate, status: "inactive" }
    );

    res.status(200).json({
      message: "Resident checked out successfully",
      availableBeds: room.capacity - room.currentOccupantCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
