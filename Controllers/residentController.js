import Resident from "../Models/residentSchema.js";

// Get resident profile by ID
export const getResidentProfile = async (req, res) => {
  const { residentId } = req.params;

  try {
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    res.status(200).json(resident);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resident profile" });
  }
};

// Update resident profile
export const updateResidentProfile = async (req, res) => {
  const { residentId } = req.params;
  const { name, contactInfo, emergencyContact } = req.body;

  try {
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    resident.name = name || resident.name;
    resident.contactInfo = contactInfo || resident.contactInfo;
    resident.emergencyContact = emergencyContact || resident.emergencyContact;

    await resident.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating resident profile" });
  }
};

// View all residents (Admin only)
export const getAllResidents = async (req, res) => {
  try {
    const residents = await Resident.find();
    res.status(200).json(residents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all residents" });
  }
};
