import Expense from "../Models/expenseSchema.js";

export const createExpense = async (req, res) => {
  try {
    const { category, amount, details, date } = req.body;

    // Validation
    if (!category || typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing category" });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid or missing amount" });
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing details" });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ message: "Invalid or missing date" });
    }

    // Create new expense
    const expense = new Expense({
      category: category.trim(),
      amount,
      details: details.trim(),
      date: new Date(date), // Ensure the date is stored as a valid Date object
    });

    await expense.save();

    res.status(200).json({
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Error creating expense" });
  }
};

export const getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    /* Validate for date range */
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }

    // Query to aggregate expenses by category
    const expenses = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: "$category", // Group by category
          totalAmount: { $sum: "$amount" }, // Sum up amounts
          count: { $sum: 1 }, // Count the number of expenses in each category
        },
      },
      {
        $sort: { totalAmount: -1 }, // Sort by totalAmount in descending order
      },
    ]);

    res.status(200).json({
      message: "Expenses grouped by category and fetched successfully",
      data: expenses,
    });
  } catch (error) {
    console.error("Error fetching expenses by category:", error);
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

/* Get expense by time */

export const getExpensesByDate = async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.body;  // Default grouping by month
    try {
      const groupStage = groupBy === 'year'
        ? {
            $dateToString: { format: '%Y', date: '$checkInDate' },  // Group by year
          }
        : {
            $dateToString: { format: '%Y-%m', date: '$checkInDate' },  // Group by month
          };
  
      const expenseData = await Booking.aggregate([
        // Match only completed bookings
        {
          $match: {
            bookingStatus: 'completed',
            checkInDate: { $gte: new Date(startDate) },
            checkOutDate: { $lte: new Date(endDate) },
          },
        },
        // Project the price breakdown fields (expenses: rent, maintenanceCharge, tax)
        {
          $project: {
            rent: '$priceBreakdown.rent',
            maintenanceCharge: '$priceBreakdown.maintenanceCharge',
            tax: '$priceBreakdown.tax',
            dateGroup: groupStage, // Add the grouping by date
          },
        },
        // Group by date (month or year) and sum the expenses categories
        {
          $group: {
            _id: '$dateGroup',  // Group by the formatted date (month or year)
            totalRent: { $sum: '$rent' },
            totalMaintenanceCharge: { $sum: '$maintenanceCharge' },
            totalTax: { $sum: '$tax' },
          },
        },
        // Project the result to include total expenses
        {
          $project: {
            _id: 0,
            date: '$_id',
            totalRent: 1,
            totalMaintenanceCharge: 1,
            totalTax: 1,
            totalExpenses: { $add: ['$totalRent', '$totalMaintenanceCharge', '$totalTax'] },
          },
        },
        {
          // Sort the results by date in descending order (optional)
          $sort: { date: -1 },
        },
      ]);
  
      return res.status(200).json({
        message: 'Expenses grouped by date successfully',
        expenses: expenseData || [],
      });
    } catch (error) {
      console.error('Error aggregating expenses by date:', error.message);
      return res.status(500).json({ message: 'Error aggregating expenses by date', error: error.message });
    }
  };