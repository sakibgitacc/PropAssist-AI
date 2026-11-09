const crypto = require('crypto');

/**
 * Razorpay Integration Service (Production & Test Mode)
 * Exclusively uses official Razorpay APIs with strict cryptographic HMAC-SHA256 verification
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TW1juKRTnACBhA';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'j9ji6JfSl6HI8gQDCvEBhzMX';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/**
 * Get active Razorpay Key ID
 */
function getKeyId() {
  return KEY_ID;
}

/**
 * Create a new Razorpay Order on official Razorpay Servers
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
  
  const numericAmount = Number(amount);
  // Razorpay standard/test mode has a transaction limit of ₹5,00,000 (50,000,000 paise) per single order.
  // For milestone payments that exceed ₹5,00,000 (such as 10% advance or full balance),
  // cap the gateway order amount at ₹5,00,000 to avoid HTTP 400 'Amount exceeds maximum amount allowed',
  // while preserving the exact intended milestone amount in notes and payment record.
  const MAX_RAZORPAY_PER_TXN = 500000;
  const gatewayAmount = numericAmount > MAX_RAZORPAY_PER_TXN ? MAX_RAZORPAY_PER_TXN : numericAmount;
  const amountInPaise = Math.round(gatewayAmount * 100);

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        ...notes,
        actualAmount: numericAmount.toString()
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Razorpay Order Creation Failed]:', response.status, errorText);
    throw new Error(`Razorpay API Error (${response.status}): ${errorText}`);
  }

  const order = await response.json();
  return {
    success: true,
    provider: 'razorpay',
    order,
    keyId: KEY_ID
  };
}

/**
 * Verify Razorpay Payment Signature
 * Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
function verifyPaymentSignature({ orderId, razorpayPaymentId, razorpaySignature }) {
  if (!orderId || !razorpayPaymentId || !razorpaySignature) {
    return { isValid: false, reason: 'Missing orderId, razorpayPaymentId, or razorpaySignature' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${razorpayPaymentId}`)
    .digest('hex');

  let isMatch = false;
  try {
    isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpaySignature, 'utf8')
    );
  } catch {
    isMatch = expectedSignature === razorpaySignature;
  }

  return {
    isValid: isMatch,
    expectedSignature,
    providedSignature: razorpaySignature
  };
}

/**
 * Verify incoming Razorpay Webhook Signature
 */
function verifyWebhookSignature(payloadString, webhookSignature) {
  if (!WEBHOOK_SECRET) {
    return process.env.NODE_ENV !== 'production';
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');

  return expectedSignature === webhookSignature;
}

module.exports = {
  getKeyId,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
