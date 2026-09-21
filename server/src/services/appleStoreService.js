import axios from 'axios';

/**
 * Service to verify Apple App Store receipts
 */
class AppleStoreService {
  constructor() {
    this.productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
    this.sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
    // Shared secret is required for subscriptions
    this.password = process.env.APPLE_SHARED_SECRET || ''; 
  }

  /**
   * Verify an Apple receipt
   */
  async verifyReceipt(receipt) {
    if (!receipt) {
      return { success: false, error: 'Receipt is missing' };
    }

    // APPLE_MOCK mode for development (if configured)
    if (process.env.APPLE_MOCK === 'true') {
      console.log('⚠️ Mocking Apple Receipt verification (Success)');
      return { success: true, mock: true };
    }

    try {
      // First try Production
      let response = await axios.post(this.productionUrl, {
        'receipt-data': receipt,
        'password': this.password,
        'exclude-old-transactions': true
      });

      // Status 21007 means the receipt is from Sandbox and should be verified there
      if (response.data.status === 21007) {
        response = await axios.post(this.sandboxUrl, {
          'receipt-data': receipt,
          'password': this.password,
          'exclude-old-transactions': true
        });
      }

      if (response.data.status === 0) {
        return { 
          success: true, 
          data: response.data,
          latest_receipt_info: response.data.latest_receipt_info || response.data.receipt.in_app
        };
      } else {
        console.error('[Apple-Verify-Error] Status:', response.data.status);
        return { success: false, error: `Apple verification failed with status: ${response.data.status}` };
      }
    } catch (err) {
      console.error('[Apple-Verify-Exception]', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Alias for product verification to match GooglePlayService interface
   */
  async verifyProduct(productId, receipt) {
    return this.verifyReceipt(receipt);
  }

  /**
   * Alias for subscription verification to match GooglePlayService interface
   */
  async verifySubscription(subscriptionId, receipt) {
    return this.verifyReceipt(receipt);
  }
}

export default new AppleStoreService();
