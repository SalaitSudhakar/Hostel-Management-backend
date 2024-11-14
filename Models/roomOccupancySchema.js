import mongoose from "mongoose";

const roomOccupancySchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    residents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resident",
      },
    ],

  },

  {
    timestamps: true,
  }
);

const RoomOccupancy = mongoose.model("RoomOccupancy", roomOccupancySchema);

export default RoomOccupancy;
