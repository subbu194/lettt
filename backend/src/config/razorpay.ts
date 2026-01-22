import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export async function initializeRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check required environment variables
    if (!keyId || !keySecret) {
        console.error('\x1b[31m❌ Razorpay Configuration Error: Missing required environment variables\x1b[0m');
        console.error('\x1b[31m   Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET\x1b[0m');
        return null;
    }

    try {
        // Initialize Razorpay instance
        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Verify the credentials by making a test API call
        // Fetch payment methods to verify credentials are valid
        try {
            await razorpayInstance.payments.all({ count: 1 });
            console.log('✅ Razorpay initialized successfully');
        } catch (apiError: any) {
            // If we get an authentication error, the credentials are wrong
            if (apiError.statusCode === 401) {
                throw new Error('Invalid Razorpay credentials');
            }
            // For other errors (like network issues), we'll still consider it initialized
            // since the credentials format is correct
            console.log('✅ Razorpay initialized successfully');
        }

        return razorpayInstance;
    } catch (error: any) {
        console.error('\x1b[31m❌ Razorpay initialization failed:\x1b[0m', error.message);
        console.error('\x1b[31m   └─ Check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET\x1b[0m');
        return null;
    }
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
