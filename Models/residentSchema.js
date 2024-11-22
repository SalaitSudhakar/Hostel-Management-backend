import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
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
    default: null,
  },
  billingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
  }],
  status: {
    type: String,
    enum: ['active', 'checked-out', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

residentSchema.index({ email: 1 }); // Indexing for faster search

const Resident = mongoose.model('Resident', residentSchema);

export default Resident;