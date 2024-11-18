import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
  },
  checkInDate: { type: Date, required: true },
  checkOutDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v > this.checkInDate;
      },
      message: "Check-out date must be after check-in date.",
    },
  },
  billingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
  }],
}, { timestamps: true });

export default mongoose.model('Resident', residentSchema);