import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();


const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSms = async () => {
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log('SMS sent:', message.sid);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

export default sendSms;