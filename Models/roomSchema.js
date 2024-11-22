import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, index: true },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Quad"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    capacity: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    bedRemaining: {
      type: Number,
    },
    residents: {
      type: Number,
      validate: {
        validator: function (value) {
          return value <= this.capacity;
        },
        message: "Room capacity exceeded",
      },
      default: 0,
    },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    amenities: [{ type: String }],
    residentHistory: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Room =  mongoose.model("Room", roomSchema);

export default Room;
