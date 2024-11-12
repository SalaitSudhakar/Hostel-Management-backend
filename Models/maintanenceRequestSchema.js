import mongoose from "mongoose";

const maintanenceRequestSchema = new mongoose.Schema(
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

    description: {
      type: String,
      required: true,
    },

    priorityLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },

    assignStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

const MaintanenceRequest = mongoose.model(
  "MaintanenceRequest",
  maintanenceRequestSchema
);

export default MaintanenceRequest;
