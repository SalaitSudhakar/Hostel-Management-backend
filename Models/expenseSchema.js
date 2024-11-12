import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["room", "utilities", "other"],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  paidBy: {
    type: Date,
    default: Date.now,
    require: true,
  },

  dailyExpense: {
    type: Number,
  },

  monthlyExpense: {
    type: Number,
  },

  yearlyExpense: {
    type: Number,
  },
});

const Expense = mongoose.model("Expense", revenueSchema);

export default Expense;
