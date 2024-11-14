import Expense from "../Models/expenseSchema.js";

// Create a new expense record
export const createExpense = async (req, res) => {
  try {
    const { category, description, amount } = req.body;

    const newExpense = new Expense({
      category,
      description,
      amount,
      paidBy: new Date(),  // Default to current date
    });

    await newExpense.save();
    res.status(201).json({ message: "Expense record created successfully", expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all expense records
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expenses by category
export const getExpensesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const expenses = await Expense.find({ category });
    if (!expenses || expenses.length === 0) {
      return res.status(404).json({ message: "No expenses found for this category" });
    }
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an expense record
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { category, description, amount } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    expense.category = category || expense.category;
    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;
    expense.paidBy = new Date();

    await expense.save();
    res.status(200).json({ message: "Expense record updated successfully", expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an expense record
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findByIdAndDelete(expenseId);
    if (!expense) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    res.status(200).json({ message: "Expense record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};