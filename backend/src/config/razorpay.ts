import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn("⚠️ Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not defined in environment variables.");
}

const razorpay = new Razorpay({
  key_id: keyId || "mock_key_id",
  key_secret: keySecret || "mock_key_secret",
});

export default razorpay;
