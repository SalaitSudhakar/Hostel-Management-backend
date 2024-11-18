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
        validate: {
          validator: function (v) {
            return this.billingPeriod.endDate > v;
          },
          message: "Start date must be before the end date.",
        },
      },
      endDate: { type: Date, required: true },
    },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    serviceCharge: { type: Number, required: true },
    lateFee: { type: Number, default: 0 },
    paymentHistory: [
      {
        paymentDate: { type: Date },
        amount: { type: Number },
        paymentMethod: { type: String, default: "cash" },
        transactionId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);
