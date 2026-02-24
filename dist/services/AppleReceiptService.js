const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const SANDBOX_REDIRECT_STATUS = 21007;
export class AppleReceiptService {
    async verify(receiptData) {
        let response = await this.callApple(APPLE_PRODUCTION_URL, receiptData);
        if (response.status === SANDBOX_REDIRECT_STATUS) {
            response = await this.callApple(APPLE_SANDBOX_URL, receiptData);
        }
        if (response.status !== 0) {
            return { isValid: false, expiresAt: null, productId: null };
        }
        const receipts = response.latest_receipt_info;
        if (!receipts || receipts.length === 0) {
            return { isValid: false, expiresAt: null, productId: null };
        }
        const latest = receipts.reduce((a, b) => Number(a.expires_date_ms) > Number(b.expires_date_ms) ? a : b);
        const expiresAt = new Date(Number(latest.expires_date_ms));
        const isValid = expiresAt > new Date();
        return {
            isValid,
            expiresAt,
            productId: latest.product_id,
        };
    }
    async callApple(url, receiptData) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "receipt-data": receiptData }),
        });
        if (!res.ok) {
            throw new Error(`Apple verification failed with HTTP ${res.status}`);
        }
        return res.json();
    }
}
