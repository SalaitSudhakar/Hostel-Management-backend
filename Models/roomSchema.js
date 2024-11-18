import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Quad'],
    required: true,
  },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },

  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
