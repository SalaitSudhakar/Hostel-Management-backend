import Booking from '../Models/bookingSchema.js';  // Import the Booking model

// Revenue grouped by rent, maintenance charge, and tax
export const getRevenueByCategory = async (req, res) => {
  try {
    const revenueData = await Booking.aggregate([
      // Match only completed bookings
      {
        $match: { bookingStatus: 'completed' },
      },
      // Project the price breakdown fields
      {
        $project: {
          rent: '$priceBreakdown.rent',
          maintenanceCharge: '$priceBreakdown.maintenanceCharge',
          tax: '$priceBreakdown.tax',
        },
      },
      // Group by total rent, maintenance charge, and tax
      {
        $group: {
          _id: null, // Grouping all data together
          totalRent: { $sum: '$rent' },
          totalMaintenanceCharge: { $sum: '$maintenanceCharge' },
          totalTax: { $sum: '$tax' },
        },
      },
      // Project the result to calculate total revenue
      {
        $project: {
          _id: 0,
          totalRent: 1,
          totalMaintenanceCharge: 1,
          totalTax: 1,
          totalRevenue: { $add: ['$totalRent', '$totalMaintenanceCharge', '$totalTax'] },
        },
      },
    ]);

    return res.status(200).json({
      message: 'Revenue grouped successfully',
      revenue: revenueData[0] || {},
    });
  } catch (error) {
    console.error('Error aggregating revenue:', error.message);
    return res.status(500).json({ message: 'Error aggregating revenue', error: error.message });
  }
};

// Revenue grouped by date (e.g., by month or by year)
export const getRevenueByDate = async (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.body;  // Default grouping by month
  try {
    const groupStage = groupBy === 'year'
      ? {
          $dateToString: { format: '%Y', date: '$checkInDate' },  // Group by year
        }
      : {
          $dateToString: { format: '%Y-%m', date: '$checkInDate' },  // Group by month
        };

    const revenueData = await Booking.aggregate([
      // Match only completed bookings
      {
        $match: {
          bookingStatus: 'completed',
          checkInDate: { $gte: new Date(startDate) },
          checkOutDate: { $lte: new Date(endDate) },
        },
      },
      // Project the price breakdown fields
      {
        $project: {
          rent: '$priceBreakdown.rent',
          maintenanceCharge: '$priceBreakdown.maintenanceCharge',
          tax: '$priceBreakdown.tax',
          dateGroup: groupStage, // Add the grouping by date
        },
      },
      // Group by date (month or year) and sum the revenue categories
      {
        $group: {
          _id: '$dateGroup',  // Group by the formatted date (month or year)
          totalRent: { $sum: '$rent' },
          totalMaintenanceCharge: { $sum: '$maintenanceCharge' },
          totalTax: { $sum: '$tax' },
        },
      },
      // Project the result to include total revenue
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRent: 1,
          totalMaintenanceCharge: 1,
          totalTax: 1,
          totalRevenue: { $add: ['$totalRent', '$totalMaintenanceCharge', '$totalTax'] },
        },
      },
      {
        // Sort the results by date in descending order (optional)
        $sort: { date: -1 },
      },
    ]);

    return res.status(200).json({
      message: 'Revenue grouped by date successfully',
      revenue: revenueData || [],
    });
  } catch (error) {
    console.error('Error aggregating revenue by date:', error.message);
    return res.status(500).json({ message: 'Error aggregating revenue by date', error: error.message });
  }
};
