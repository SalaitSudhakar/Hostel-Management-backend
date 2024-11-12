import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["rent", "maintenance", "other"],
    category: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  receivedBy: {
    type: Date,
    required: true,
    default: date.now,
  },


  dailyRevenue: {
    type: Number,
    default: 0
  },

  monthlyRevenue: {
    type: Number,
    default: 0
  },

  yearlyRevenue: {
    type: Number,
    default: 0
  },
});

const Revenue = mongoose.model("Revenue", revenueSchema);

export default Revenue;
