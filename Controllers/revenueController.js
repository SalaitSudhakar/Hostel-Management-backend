import Revenue from "../Models/revenueSchema.js";

// Create a new revenue record
export const createRevenue = async (req, res) => {
  try {
    const { category, amount } = req.body;

    const newRevenue = new Revenue({
      category,
      amount,
      receivedBy: new Date(),  // Default to current date
    });

    await newRevenue.save();
    res.status(201).json({ message: "Revenue record created successfully", revenue: newRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all revenue records
export const getAllRevenue = async (req, res) => {
  try {
    const revenues = await Revenue.find();
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get revenue by category
export const getRevenueByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const revenues = await Revenue.find({ category });
    if (!revenues || revenues.length === 0) {
      return res.status(404).json({ message: "No revenue found for this category" });
    }
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a revenue record
export const updateRevenue = async (req, res) => {
  try {
    const { revenueId } = req.params;
    const { category, amount } = req.body;

    const revenue = await Revenue.findById(revenueId);
    if (!revenue) {
      return res.status(404).json({ message: "Revenue record not found" });
    }

    revenue.category = category || revenue.category;
    revenue.amount = amount || revenue.amount;
    revenue.receivedBy = new Date();

    await revenue.save();
    res.status(200).json({ message: "Revenue record updated successfully", revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a revenue record
export const deleteRevenue = async (req, res) => {
  try {
    const { revenueId } = req.params;

    const revenue = await Revenue.findByIdAndDelete(revenueId);
    if (!revenue) {
      return res.status(404).json({ message: "Revenue record not found" });
    }

    res.status(200).json({ message: "Revenue record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};