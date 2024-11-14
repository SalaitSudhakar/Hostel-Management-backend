import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["room", "utilities", "other"],
    required: true,
  },

  description: {
    type: String,
  },

  amount: {
    type: Number,
    required: true,
  },

  paidBy: {
    type: Date,
    default: Date.now,
    required: true,
  },

});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
