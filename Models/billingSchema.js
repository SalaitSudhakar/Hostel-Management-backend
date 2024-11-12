import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    billingPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },

    amountDue: {
      type: Number,
      required: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially paid", "paid", "late"],
      default: "unpaid",
    },

    dueDate: {
      type: Date,
      required: true,
    },

    paymentHistory: [
      {
        paymentDate: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "credit card", "bank transfer", "online"],
          required: true,
        },
        transactionId: {
          type: String,
          required: true,
        },
      },
    ],
    
    lateFee: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;
