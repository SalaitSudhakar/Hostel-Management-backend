
  // Occupancy Rate grouped by date (e.g., by month or year)
export const roomOccupancyRateByDate = async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.body;  // Default grouping by month
    try {
      const groupStage = groupBy === 'year'
        ? {
            $dateToString: { format: '%Y', date: '$checkInDate' },  // Group by year
          }
        : {
            $dateToString: { format: '%Y-%m', date: '$checkInDate' },  // Group by month
          };
  
      const occupancyData = await Booking.aggregate([
        // Match only completed bookings
        {
          $match: {
            bookingStatus: 'completed',
            checkInDate: { $gte: new Date(startDate) },
            checkOutDate: { $lte: new Date(endDate) },
          },
        },
        // Project the relevant fields for occupancy calculation
        {
          $project: {
            totalRooms: '$totalRooms', // Assuming you have a field for total rooms
            occupiedRooms: '$occupiedRooms', // Assuming you have a field for occupied rooms
            dateGroup: groupStage, // Add the grouping by date
          },
        },
        // Group by date (month or year) and calculate the occupancy rate
        {
          $group: {
            _id: '$dateGroup',  // Group by the formatted date (month or year)
            totalRooms: { $sum: '$totalRooms' },
            occupiedRooms: { $sum: '$occupiedRooms' },
          },
        },
        // Project the result to calculate the occupancy rate
        {
          $project: {
            _id: 0,
            date: '$_id',
            totalRooms: 1,
            occupiedRooms: 1,
            occupancyRate: {
              $cond: {
                if: { $eq: ['$totalRooms', 0] },
                then: 0, // Avoid division by zero
                else: { $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] },
              },
            },
          },
        },
        {
          // Sort the results by date in descending order (optional)
          $sort: { date: -1 },
        },
      ]);
  
      return res.status(200).json({
        message: 'Occupancy rate grouped by date successfully',
        occupancyRate: occupancyData || [],
      });
    } catch (error) {
      console.error('Error calculating occupancy rate by date:', error.message);
      return res.status(500).json({ message: 'Error calculating occupancy rate by date', error: error.message });
    }
  };