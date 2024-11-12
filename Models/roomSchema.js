import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },

    roomType: {
      type: String,
      enum: ["Ac", "NonAc"],
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    currentOccupantCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: function () {
        return this.capacity;
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    price: {
      type: Number,
      required: true,
    },

    /* status: {
      type: String,
      enum: ["available", "occupied", "maintanence", "reserved"],
      default: "available",
    }, */
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
