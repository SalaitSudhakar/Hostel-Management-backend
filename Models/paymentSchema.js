import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    billingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      required: true,
    },
    paymentMethod: { type: String, enum: ["paypal", "card"], required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    transactionId: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    refundTransactionId: { type: String, default: null },
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["none", "initiated", "completed"],
      default: "none",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
