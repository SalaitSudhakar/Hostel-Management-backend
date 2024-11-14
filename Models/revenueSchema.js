import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["rent", "maintenance", "other"],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  receivedBy: {
    type: Date,
    required: true,
    default: Date.now,
  },

});

const Revenue = mongoose.model("Revenue", revenueSchema);

export default Revenue;