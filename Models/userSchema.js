import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  token: { type: String },
  role: {
    type: String,
    enum: ['admin', 'resident', 'staff'],
    default: 'resident',
  },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
}, { timestamps: true });

const User =  mongoose.model('User', userSchema);

export default User;