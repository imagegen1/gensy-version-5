/**
 * PhonePe Payment Gateway Integration for Gensy AI Creative Suite
 * Handles secure payment processing for subscriptions and credit purchases
 */

import crypto from 'crypto'
import { getBaseUrl } from '../utils'

export interface PaymentRequest {
  amount: number
  userId: string
  planId?: string
  type: 'subscription' | 'credits'
  description?: string
}

export interface PaymentResponse {
  success: boolean
  merchantTransactionId: string
  paymentUrl?: string
  error?: string
}

export interface WebhookData {
  merchantId: string
  merchantTransactionId: string
  transactionId: string
  amount: number
  state: string
  responseCode: string
  paymentInstrument: {
    type: string
    [key: string]: any
  }
}

export class PhonePeService {
  private static readonly PHONEPE_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/hermes'

  private static readonly MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT'
  private static readonly SALT_KEY = process.env.PHONEPE_SALT_KEY || 'salt_key'
  private static readonly SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1'
  private static readonly APP_URL = getBaseUrl()

  /**
   * Create a payment request with PhonePe
   */
  static async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantTransactionId = `TXN_${Date.now()}_${request.userId.slice(-8)}`
      
      const paymentData = {
        merchantId: this.MERCHANT_ID,
        merchantTransactionId,
        merchantUserId: request.userId,
        amount: Math.round(request.amount * 100), // Convert to paise
        redirectUrl: `${this.APP_URL}/payment/callback`,
        redirectMode: 'POST',
        callbackUrl: `${this.APP_URL}/api/webhooks/phonepe`,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      }

      // In development mode, return mock response
      if (process.env.NODE_ENV !== 'production') {
        return this.createMockPaymentResponse(merchantTransactionId, request.amount)
      }

      const base64Data = Buffer.from(JSON.stringify(paymentData)).toString('base64')
      const checksum = this.generateChecksum(base64Data, '/pg/v1/pay')

      const response = await fetch(`${this.PHONEPE_BASE_URL}/pg/v1/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          request: base64Data
        })
      })

      const result = await response.json()

      if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
        return {
          success: true,
          merchantTransactionId,
          paymentUrl: result.data.instrumentResponse.redirectInfo.url
        }
      } else {
        throw new Error(result.message || 'Payment request failed')
      }

    } catch (error) {
      console.error('PhonePe payment creation failed:', error)
      return {
        success: false,
        merchantTransactionId: '',
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(merchantTransactionId: string): Promise<{
    success: boolean
    status: string
    amount?: number
    error?: string
  }> {
    try {
      // In development mode, return mock success
      if (process.env.NODE_ENV !== 'production') {
        return {
          success: true,
          status: 'PAYMENT_SUCCESS',
          amount: 999 // Mock amount in paise
        }
      }

      const checksum = this.generateChecksum('', `/pg/v1/status/${this.MERCHANT_ID}/${merchantTransactionId}`)

      const response = await fetch(
        `${this.PHONEPE_BASE_URL}/pg/v1/status/${this.MERCHANT_ID}/${merchantTransactionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': this.MERCHANT_ID,
            'accept': 'application/json'
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        return {
          success: true,
          status: result.data?.state || 'UNKNOWN',
          amount: result.data?.amount
        }
      } else {
        return {
          success: false,
          status: 'FAILED',
          error: result.message || 'Status check failed'
        }
      }

    } catch (error) {
      console.error('PhonePe status check failed:', error)
      return {
        success: false,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Status check failed'
      }
    }
  }

  /**
   * Generate checksum for PhonePe API requests
   */
  static generateChecksum(data: string, endpoint: string): string {
    const string = data + endpoint + this.SALT_KEY
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    return sha256 + '###' + this.SALT_INDEX
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!signature) return false

      const [hash, saltIndex] = signature.split('###')
      if (saltIndex !== this.SALT_INDEX) return false

      const expectedHash = crypto
        .createHash('sha256')
        .update(body + this.SALT_KEY)
        .digest('hex')

      return hash === expectedHash
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * Parse webhook data
   */
  static parseWebhookData(body: string): WebhookData | null {
    try {
      const data = JSON.parse(body)
      
      if (!data.response) {
        throw new Error('Invalid webhook data format')
      }

      const decodedData = Buffer.from(data.response, 'base64').toString('utf-8')
      return JSON.parse(decodedData)
    } catch (error) {
      console.error('Webhook data parsing failed:', error)
      return null
    }
  }

  /**
   * Create mock payment response for development
   */
  private static createMockPaymentResponse(merchantTransactionId: string, amount: number): PaymentResponse {
    const mockPaymentUrl = `${this.APP_URL}/payment/mock?txnId=${merchantTransactionId}&amount=${amount}`
    
    return {
      success: true,
      merchantTransactionId,
      paymentUrl: mockPaymentUrl
    }
  }

  /**
   * Get supported payment methods
   */
  static getSupportedPaymentMethods(): string[] {
    return [
      'UPI',
      'CARD',
      'NET_BANKING',
      'WALLET'
    ]
  }

  /**
   * Format amount for display
   */
  static formatAmount(amountInPaise: number): string {
    const rupees = amountInPaise / 100
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(rupees)
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' }
    }

    if (amount < 1) {
      return { valid: false, error: 'Minimum amount is ₹1' }
    }

    if (amount > 200000) {
      return { valid: false, error: 'Maximum amount is ₹2,00,000' }
    }

    return { valid: true }
  }
}
