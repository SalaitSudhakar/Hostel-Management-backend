import Resident from "../Models/residentSchema.js";

/* // Regex Patterns for Validation
const phoneRegex = /^\+[1-9]{1}[0-9]{1,3}[0-9]{10}$/;  // Validates 10-digit phone numbers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Validates email format
const nameRegex = /^[a-zA-Z0-9\s]{2,50}$/; // Validates names with only letters and spaces (2 to 50 chars)
 */
// Create a new resident
export const createResident = async (req, res) => {
  try {
    const {roomNumber, emergencyContact, checkInDate, checkOutDate } = req.body;
    const userId = req.user._id;

    if (!roomNumber) {
      return res.status(400).json({ message: "Room is required" });
    }

    const roomDocument = await Room.findOne({ roomNumber });
    if (!roomDocument) {
      return res.status(404).json({ message: "Room not found" });
    }
   // get the room object Id from the room document
   const roomId = roomDocument._id; 

   // Validate emergencyContact
   if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone) {
    return res.status(400).json({ message: "Invalid emergency contact format" });
  }

    if (!checkInDate || isNaN(Date.parse(checkInDate))) {
      return res.status(400).json({ message: "Invalid check-in date format" });
    }
    
    // Check if the resident already exists
    const existingResident = await Resident.findOne({ user: userId })
    .populate("room", "roomNumber")
    .populate("user", "_id name email phoneNumber");


    if (existingResident) {
      return res.status(400).json({ message: "Resident profile already exists" });
    }

    // Create new resident profile
    const newResident = new Resident({
      user: userId,
      room: roomId,
      emergencyContact,
      checkInDate,
      checkOutDate: checkOutDate || null,
    });

    await newResident.save();
    res.status(201).json({ message: "Resident profile created successfully", resident: newResident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating resident profile" });
  }
};

// Get resident profile by email
export const getResidentProfile = async (req, res) => {

  const { id } = req.params;
  try {
    const resident = await Resident.findById(id)
    .populate({ path: "room", select: "roomNumber" }) // Replace `capacity` with any other valid Room field
    .populate({ path: "user", select: "_id name email phoneNumber" })
    .populate({ path: "billingHistory", select: "amount date status" });

    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    res.status(200).json({ success: true, data: resident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching resident profile" });
  }
};

// Update resident profile
export const updateResidentProfile = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { name, email, phoneNumber, emergencyContact } = req.body;

    // Validation
    if (name && !nameRegex.test(name)) {
      return res.status(400).json({ message: "Invalid name format" });
    }

    // email validation
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // phone number validation
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    if (
      emergencyContact &&
      (!nameRegex.test(emergencyContact.name) || !phoneRegex.test(emergencyContact.phone))
    ) {
      return res.status(400).json({ message: "Invalid emergency contact format" });
    }

    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    resident.name = name || resident.name;
    resident.emergencyContact = emergencyContact || resident.emergencyContact;

    await resident.save();
    res.status(200).json({ message: "Profile updated successfully", resident });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating resident profile" });
  }
};

// View all residents
export const getAllResidents = async (req, res) => {
  try {
    const residents = await Resident.find();
    res.status(200).json(residents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all residents" });
  }
};
