import paypal, { payment } from "paypal-rest-sdk";
import connectDb from './../Database/dbConfig';

// Configure paypal sdk
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

// Create a Payment
export const createPayment = async (req, res) => {
  try {
    const { total, currency } = req.body;

    const createPaymentJson = {
      intent: "rent",
      payer: {
        payment_method: "paypal",
      },
      tranacrions: [
        {
          amount: {
            total,
            currency,
          },
        },
      ],

      redirect_urls: {
        return_url: "http://localhost:5000/api/paypal/success",
        cancel_url: "http://localhost:5000/api/paypal/cancel",
      },
    };

    paypal.payment.create(createPaymentJson, (error, payment) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error creating payment" });
      }
      const approvalUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      ).href;
      res.status(200).json({ approvalUrl });
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle Successful Payment
export const successPayment = async (req, res) => {
  try {
    const { paymentId, PayerID } = req.query;

    const executePaymentJson = {
      payer_id: PayerID,
    };

    paypal.payment.execute(paymentId, executePaymentJson, (error, payment) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error creating payment" });
      }

      res
        .status(200)
        .json({ message: "Payment executed successfully", data: payment });
    });
  } catch (error) {
    console.error("Error handling payment success:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// Handle Cancelled Payment

export const cancelPayment = (req, res) => {
    res.status(400).json({ message: "Payment cancelled by the user" });
}