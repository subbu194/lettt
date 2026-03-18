import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export async function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  console.log("✅ Razorpay initialized successfully");
  return razorpayInstance;
}

export function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    throw new Error('Razorpay instance not initialized. Call initializeRazorpay() first.');
  }
  return razorpayInstance;
}

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID is not configured');
  }
  return keyId;
}
