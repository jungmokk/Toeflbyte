import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

/**
 * Service to verify Google Play Store purchases/subscriptions
 */
class GooglePlayService {
  constructor() {
    this.auth = null;
    this.androidPublisher = null;
    this.packageName = process.env.PACKAGE_NAME || 'com.toeflbyte.app'; 
  }

  async init() {
    if (this.androidPublisher) return;

    try {
      const keyFilePath = path.join(process.cwd(), 'google-play-service-account.json');
      
      if (!fs.existsSync(keyFilePath)) {
        console.warn('⚠️ google-play-service-account.json not found. IAP verification will run in MOCK mode.');
        return;
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const authClient = await this.auth.getClient();
      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient,
      });
      
      console.log('✅ Google Play Android Publisher API initialized.');
    } catch (err) {
      console.error('❌ Failed to initialize Google Play Service:', err.message);
    }
  }

  /**
   * Verify a one-time purchase (Product)
   */
  async verifyProduct(productId, purchaseToken) {
    if (!this.androidPublisher) {
      console.log('⚠️ Mocking Product verification (Success)');
      return { success: true, mock: true };
    }

    try {
      const res = await this.androidPublisher.purchases.products.get({
        packageName: this.packageName,
        productId,
        token: purchaseToken,
      });

      // 0: Purchased, 1: Canceled, 2: Pending
      if (res.data.purchaseState === 0) {
        return { success: true, data: res.data };
      }
      return { success: false, error: 'Purchase not in completed state' };
    } catch (err) {
      console.error('[VerifyProduct-Error]', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify a subscription
   */
  async verifySubscription(subscriptionId, purchaseToken) {
    if (!this.androidPublisher) {
      console.log('⚠️ Mocking Subscription verification (Success)');
      return { success: true, mock: true };
    }

    try {
      const res = await this.androidPublisher.purchases.subscriptions.get({
        packageName: this.packageName,
        subscriptionId,
        token: purchaseToken,
      });

      // Check if subscription is active or in grace period
      const now = Date.now();
      const expiryTime = parseInt(res.data.expiryTimeMillis);
      
      if (expiryTime > now) {
        return { success: true, data: res.data };
      }
      return { success: false, error: 'Subscription expired' };
    } catch (err) {
      console.error('[VerifySubscription-Error]', err.message);
      return { success: false, error: err.message };
    }
  }
}

export default new GooglePlayService();
