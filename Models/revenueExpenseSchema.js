import mongoose from 'mongoose';

const revenueExpenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['Revenue', 'Expense'],
    required: true,
  },
  category: {
    type: String,
    enum: ['Rent', 'Salary', 'Maintenance', 'Other'],
    required: true,
  },
  amount: { type: Number, required: true },
  details: { type: String },
}, { timestamps: true });

export default mongoose.model('RevenueExpense', revenueExpenseSchema);
