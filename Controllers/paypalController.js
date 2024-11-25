import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';

dotenv.config();
// Configure PayPal environment
const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;
  
  return process.env.PAYPAL_MODE === 'live'
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
};

// Create PayPal client
const client = () => {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
};

// Create a Payment
export const createPayment = async (req, res) => {
  try {
    const { total, currency } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: total
        }
      }],
      application_context: {
        return_url: "http://localhost:5000/api/paypal/success",
        cancel_url: "http://localhost:5000/api/paypal/cancel"
      }
    });

    const order = await client().execute(request);
    
    const approvalUrl = order.result.links.find(
      link => link.rel === "approve"
    ).href;

    if (!approvalUrl) {
      return res.status(500).json({ message: "Approval URL not found" });
    }

    res.status(200).json({ 
      orderId: order.result.id,
      approvalUrl 
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle Successful Payment
export const successPayment = async (req, res) => {
  try {
    const { token: orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: "Missing order ID" });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    res.status(200).json({
      message: "Payment captured successfully",
      data: capture.result
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle Cancelled Payment
export const cancelPayment = (req, res) => {
  res.status(400).json({ message: "Payment cancelled by the user" });
};

// Handle Refund Payment
export const refundPayment = async (req, res) => {
  try {
    const { captureId, amount, currency } = req.body;

    if (!captureId) {
      return res.status(400).json({ message: "Missing capture ID" });
    }

    const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId);
    request.requestBody({
      amount: {
        value: amount,
        currency_code: currency
      }
    });

    const refund = await client().execute(request);

    res.status(200).json({
      message: "Refund processed successfully",
      data: refund.result
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



/* 

{
    "scope": "https://uri.paypal.com/services/payments/futurepayments https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/vault/payment-tokens/read https://uri.paypal.com/services/disputes/read-buyer https://uri.paypal.com/services/payments/realtimepayment https://uri.paypal.com/services/disputes/update-seller https://uri.paypal.com/services/payments/payment/authcapture openid https://uri.paypal.com/services/disputes/read-seller Braintree:Vault https://uri.paypal.com/services/payments/refund https://api.paypal.com/v1/vault/credit-card https://api.paypal.com/v1/payments/.* https://uri.paypal.com/payments/payouts https://uri.paypal.com/services/vault/payment-tokens/readwrite https://api.paypal.com/v1/vault/credit-card/.* https://uri.paypal.com/services/subscriptions https://uri.paypal.com/services/applications/webhooks",
    "access_token": "A21AAL_Kz-uiOXi4rKNBkUWip4kgFdyruV69u0IyWIvQWwxn4DKO1JbZdZuck8f874W8iGTHx0XOwJ99BHLE7KQr5YNXE_SgA",
    "token_type": "Bearer",
    "app_id": "APP-80W284485P519543T",
    "expires_in": 32400,
    "nonce": "2024-11-23T05:47:57ZAgrs8WfSK1ui1kYrNOiyB32yBEy19jWZo8abINx0rYI"
}
*/