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
      validate: {
        validator:function (value) {
        return value <= this.capacity;
      },
      message: "Current occupant count cannot exceed the room capacity."
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
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    }, */
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
