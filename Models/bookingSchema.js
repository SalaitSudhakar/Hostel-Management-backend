import mongoose from 'mongoose';


// Booking Schema
const BookingSchema = new mongoose.Schema({
  // Unique Booking Reference
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // User who made the booking
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Room being booked
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },

  // Booking Dates
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },

  // Guest Details
  guests: {
    type: {
      adults: {
        type: Number,
        default: 1,
        min: 1,
        required: true
      },
      children: {
        type: Number,
        default: 0,
        min: 0
      },
      infantsUnder2: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    required: true
  },

  // Number of Rooms
  numberOfRooms: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },

  // Pricing Information
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  priceBreakdown: {
    basePrice: {
      type: Number,
      min: 0
    },
    taxes: {
      type: Number,
      min: 0
    },
    fees: {
      type: Number,
      min: 0
    }
  },

  // Booking Status
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },

  // Payment Details
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      trim: true
    },
    paidAt: Date
  },

}, {
  timestamps: true
});

// Indexes for performance
BookingSchema.index({ user: 1 });
BookingSchema.index({ room: 1 });
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

export default Booking;