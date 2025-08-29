/**
 * PhonePe Payment Gateway Integration for Gensy AI Creative Suite
 * Real PhonePe API integration based on official documentation
 */

import { getBaseUrl } from '../utils'
import { createHash } from 'crypto'

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
  orderId?: string
  error?: string
}

export interface AuthTokenResponse {
  access_token: string
  expires_at: number
  token_type: string
}

export class PhonePeService {
  private static readonly PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com'
  private static readonly CLIENT_ID = process.env.PHONEPE_CLIENT_ID
  private static readonly CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET
  private static readonly CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1'
  private static readonly APP_URL = getBaseUrl()
  private static readonly ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'sandbox'

  // Cache for auth token
  private static authToken: string | null = null
  private static tokenExpiresAt: number = 0

  /**
   * Get or refresh authentication token
   */
  private static async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.authToken && Date.now() < this.tokenExpiresAt) {
      return this.authToken
    }

    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('PhonePe credentials not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET')
    }

    try {
      const tokenUrl = this.ENVIRONMENT === 'production'
        ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'

      const formData = new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_version: this.CLIENT_VERSION,
        client_secret: this.CLIENT_SECRET,
        grant_type: 'client_credentials'
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${response.statusText}`)
      }

      const tokenData: AuthTokenResponse = await response.json()

      // Cache the token
      this.authToken = tokenData.access_token
      this.tokenExpiresAt = tokenData.expires_at * 1000 // Convert to milliseconds

      return tokenData.access_token
    } catch (error) {
      console.error('PhonePe token generation failed:', error)
      throw new Error('Failed to authenticate with PhonePe')
    }
  }

  /**
   * Create a payment request with PhonePe (Real API with Development Fallback)
   */
  static async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate unique merchant order ID
      const merchantOrderId = `GENSY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Check if we have valid credentials
      if (!this.isConfigured()) {
        console.warn('⚠️ PhonePe credentials not configured. Using development mode.')
        return this.createDevelopmentPaymentResponse(merchantOrderId, request)
      }

      // Get authentication token
      const authToken = await this.getAuthToken()

      // Prepare payment request data according to PhonePe API v2
      const paymentData = {
        merchantOrderId,
        amount: Math.round(request.amount * 100), // Convert to paise
        expireAfter: 1200, // 20 minutes
        metaInfo: {
          udf1: request.type,
          udf2: request.planId || '',
          udf3: request.userId,
          udf4: request.description || '',
          udf5: 'gensy-payment'
        },
        paymentFlow: {
          type: 'PG_CHECKOUT',
          message: request.description || 'Payment for Gensy services',
          merchantUrls: {
            redirectUrl: `${this.APP_URL}${process.env.PHONEPE_CALLBACK_URL || '/api/payments/callback'}?merchantTransactionId=${merchantOrderId}`
          }
        }
      }

      console.log('Creating PhonePe payment request:', {
        merchantOrderId,
        amount: paymentData.amount,
        environment: this.ENVIRONMENT
      })

      // Make API call to PhonePe
      const apiUrl = this.ENVIRONMENT === 'production'
        ? 'https://api.phonepe.com/apis/pg/checkout/v2/pay'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${authToken}`
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`PhonePe API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()

      if (result.orderId && result.redirectUrl) {
        return {
          success: true,
          merchantTransactionId: merchantOrderId,
          orderId: result.orderId,
          paymentUrl: result.redirectUrl
        }
      } else {
        throw new Error(result.message || 'Payment request failed')
      }

    } catch (error) {
      console.error('PhonePe payment creation failed:', error)

      // Fallback to development mode if credentials are invalid
      if (error instanceof Error && error.message.includes('Failed to authenticate with PhonePe')) {
        console.warn('🔄 Falling back to development mode due to authentication failure')
        const merchantOrderId = `GENSY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return this.createDevelopmentPaymentResponse(merchantOrderId, request)
      }

      return {
        success: false,
        merchantTransactionId: '',
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  /**
   * Create development payment response for testing
   */
  private static createDevelopmentPaymentResponse(merchantOrderId: string, request: PaymentRequest): PaymentResponse {
    const developmentPaymentUrl = `${this.APP_URL}/payment/development-success?orderId=${merchantOrderId}&amount=${request.amount}&plan=${request.planId}`

    console.log('🧪 Development payment created:', {
      merchantOrderId,
      amount: request.amount,
      paymentUrl: developmentPaymentUrl,
      note: 'This is a development payment - configure PhonePe credentials for production'
    })

    return {
      success: true,
      merchantTransactionId: merchantOrderId,
      orderId: merchantOrderId,
      paymentUrl: developmentPaymentUrl
    }
  }

  /**
   * Check payment status using PhonePe's official status API
   */
  static async checkPaymentStatus(merchantTransactionId: string): Promise<{
    success: boolean
    status: string
    amount?: number
    error?: string
  }> {
    try {
      // Extract merchant ID from CLIENT_ID (remove suffix after underscore)
      const merchantId = this.CLIENT_ID?.split('_')[0]
      if (!merchantId || !this.CLIENT_SECRET) {
        throw new Error('PhonePe merchant ID or salt key not configured')
      }

      // Create the endpoint path for checksum generation
      const endpointPath = `/pg/v1/status/${merchantId}/${merchantTransactionId}`

      // Generate checksum: SHA256(endpointPath + saltKey) + ### + saltIndex
      const saltKey = this.CLIENT_SECRET
      const saltIndex = '1'
      const checksumPayload = endpointPath + saltKey
      const checksum = createHash('sha256').update(checksumPayload).digest('hex')
      const xVerifyHeader = `${checksum}###${saltIndex}`

      // Make the API call
      const apiUrl = this.ENVIRONMENT === 'production'
        ? `https://api.phonepe.com/apis/hermes${endpointPath}`
        : `https://api-preprod.phonepe.com/apis/pg-sandbox${endpointPath}`

      console.log('PhonePe status check:', {
        apiUrl,
        merchantId,
        merchantTransactionId,
        endpointPath
      })

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': merchantId
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('PhonePe status check failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl,
          headers: {
            'X-VERIFY': xVerifyHeader,
            'X-MERCHANT-ID': merchantId
          }
        })

        return {
          success: false,
          status: 'ERROR',
          error: `HTTP ${response.status}: ${errorText || response.statusText}`
        }
      }

      const result = await response.json()
      console.log('Payment status response:', result)

      // Parse PhonePe response format
      if (result.success && result.data) {
        return {
          success: true,
          status: result.data.state || 'COMPLETED',
          amount: result.data.amount
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
   * Verify webhook signature (for future webhook implementation)
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      // TODO: Implement webhook signature verification based on PhonePe documentation
      console.log('Webhook signature verification - to be implemented', { body, signature })
      return true
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * Get supported payment methods
   */
  static getSupportedPaymentMethods(): string[] {
    return [
      'UPI_INTENT',
      'UPI_COLLECT',
      'UPI_QR',
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
   * Validate payment amount according to PhonePe limits
   */
  static validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' }
    }

    if (amount < 1) {
      return { valid: false, error: 'Minimum amount is ₹1 (100 paise)' }
    }

    if (amount > 200000) {
      return { valid: false, error: 'Maximum amount is ₹2,00,000' }
    }

    return { valid: true }
  }

  /**
   * Check if PhonePe is properly configured
   */
  static isConfigured(): boolean {
    return !!(this.CLIENT_ID && this.CLIENT_SECRET)
  }
}
