import mongoose from "mongoose";

const roomOccupancySchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "vacated", "overdue"],
      default: "active",
    },

    billingStatus: {
      type: String,
      enum: ["paid", "unpaid", "late"],
      default: "unpaid",
    },

    checkInDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    checkOutDate: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);


const RoomOccupancy = mongoose.model("RoomOccupancy", roomOccupancySchema);

export default RoomOccupancy;