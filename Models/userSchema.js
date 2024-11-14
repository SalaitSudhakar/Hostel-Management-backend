import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Resident", "Staff", "Admin"],
      default: "Resident",
    },

    password: {
      type: String,
      required: true,
    },

    token: {
      type: String,
    },

    dateOfBirth: {
      type: Date,
      require: true,
    },

    emergencyContact: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
