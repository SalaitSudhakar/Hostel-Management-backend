import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "room",
    },
    emergencyContact: {
      name: { type: String },
      phoneNumber: { type: String },
      relationship: { type: String },
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "non resident"],
      default: "non resident"
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
    billingHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "billing",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Resident = mongoose.model("resident", residentSchema);

export default Resident;
