import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phoneNumber: {
      type: Number,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true
    },

    token : {
      type: String,
    },

    role: {
      type: String,
      enum: ["Resident", "Staff", "Admin"],
      default: "Resident",
    },

    dateofbirth: {
      type: Date,
      require: true,
    },

    emergencyContact: {
      name: {
        type: String,
        required: true,
      },

      phoneNumber: {
        type: Number,
        required: true,
      },
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

    updatedAt: {
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
