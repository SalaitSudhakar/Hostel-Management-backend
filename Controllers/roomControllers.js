import Room from "../Models/roomSchema.js";

// Create Room
export const createRoom = async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    await newRoom.save();

    res
      .status(200)
      .json({ message: "Room Created Successfully", data: newRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById({ id });
    if (!room) {
      return res.status(404).json({ message: "Room Not Found" });
    }

    const updateRoom = new Room.findByIdAndUpdate(id, req.body, { new: true });

    res
      .status(200)
      .json({ message: "Room Updated Successfully", data: updateRoom });
  } catch (error) {
    res.status;
  }
};


// Delete Room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById({ id });
    if (!room) {
      return res.status(404).json({ message: "Room Not Found" });
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json({ message: "Room Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};  

// Get All Rooms
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).json({ message: "Rooms Fetched Successfully", data: rooms });   
    } catch (error) {
     res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });       
    }
}

// Get Single Room
export const getSingleRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id);
        res.status(200).json({ message: "Room Fetched Successfully", data: room });   
    } catch (error) {
     res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });       
    }
}