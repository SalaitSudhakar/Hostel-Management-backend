import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
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

const Resident = mongoose.model("Resident", residentSchema);

export default Resident;