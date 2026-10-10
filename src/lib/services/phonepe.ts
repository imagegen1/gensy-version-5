/**
 * PhonePe Payment Gateway Integration for Gensy AI Creative Suite
 * Real PhonePe API integration based on official documentation
 */

import { getBaseUrl } from '../utils'
import crypto from 'crypto'

// Import PhonePe SDK
let StandardCheckoutClient: any = null
let Env: any = null
let MetaInfo: any = null
let StandardCheckoutPayRequest: any = null

// The package is installed as the `pg-sdk-node` npm alias.
try {
  const phonePeSDK = require('pg-sdk-node')
  StandardCheckoutClient = phonePeSDK.StandardCheckoutClient
  Env = phonePeSDK.Env
  MetaInfo = phonePeSDK.MetaInfo
  StandardCheckoutPayRequest = phonePeSDK.StandardCheckoutPayRequest
  console.log('✅ PhonePe SDK imported successfully')
} catch (error) {
  console.warn('⚠️ PhonePe SDK not available, using fallback implementation:', error)
}

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
  private static readonly CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'PGTESTPAYUAT'
  private static readonly CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
  private static readonly CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1')
  private static readonly APP_URL = getBaseUrl()
  private static readonly ENVIRONMENT = process.env.PHONEPE_ENVIRONMENT || 'sandbox'

  // Static initialization to log configuration on startup
  static {
    console.log('🔧 PhonePe Service Configuration:', {
      baseUrl: this.PHONEPE_BASE_URL,
      clientId: this.CLIENT_ID,
      environment: this.ENVIRONMENT,
      appUrl: this.APP_URL,
      nodeEnv: process.env.NODE_ENV,
      developmentMode: process.env.PHONEPE_DEVELOPMENT_MODE
    })
  }

  // PhonePe SDK client instance
  private static client: any = null

  /**
   * Initialize PhonePe SDK client
   */
  private static getSDKClient(): any {
    if (!this.client && StandardCheckoutClient && Env) {
      try {
        const env = this.ENVIRONMENT === 'production' ? Env.PRODUCTION : Env.SANDBOX
        this.client = StandardCheckoutClient.getInstance(
          this.CLIENT_ID,
          this.CLIENT_SECRET,
          this.CLIENT_VERSION,
          env
        )
        console.log('✅ PhonePe SDK client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize PhonePe SDK client:', error)
        this.client = null
      }
    }
    return this.client
  }

  /**
   * Generate X-VERIFY header for PhonePe API authentication (fallback method)
   */
  private static generateXVerifyHeader(payload: string, endpoint: string): string {
    const string = payload + endpoint + this.CLIENT_SECRET
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    return sha256 + '###1'
  }

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
   * Create a payment request with PhonePe using official SDK
   */
  static async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate unique merchant transaction ID
      const merchantTransactionId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`

      console.log('🚀 Creating PhonePe payment request:', {
        merchantTransactionId,
        amount: request.amount,
        environment: this.ENVIRONMENT,
        sdkAvailable: !!StandardCheckoutClient,
        baseUrl: this.PHONEPE_BASE_URL,
        clientId: this.CLIENT_ID ? 'SET' : 'NOT_SET',
        clientSecret: this.CLIENT_SECRET ? 'SET' : 'NOT_SET',
        developmentMode: process.env.PHONEPE_DEVELOPMENT_MODE
      })

      // Check if we have valid credentials
      if (!this.isConfigured()) {
        console.error('❌ PhonePe credentials not configured:', {
          clientId: this.CLIENT_ID,
          clientSecret: this.CLIENT_SECRET ? '[HIDDEN]' : 'NOT_SET',
          environment: this.ENVIRONMENT,
          developmentMode: process.env.PHONEPE_DEVELOPMENT_MODE
        })

        if (process.env.PHONEPE_DEVELOPMENT_MODE === 'true') {
          console.warn('⚠️ PhonePe credentials not configured. Using development mode.')
          return this.createDevelopmentPaymentResponse(merchantTransactionId, request)
        } else {
          throw new Error('Payment gateway not configured. Please contact support.')
        }
      }

      // Try to use official PhonePe SDK first
      if (StandardCheckoutClient && MetaInfo && StandardCheckoutPayRequest) {
        try {
          console.log('✅ Using official PhonePe SDK')

          const client = this.getSDKClient()
          if (!client) {
            throw new Error('Failed to initialize PhonePe SDK client')
          }

          // Create meta info for additional data
          const metaInfo = MetaInfo.builder()
            .udf1(request.type)
            .udf2(request.planId || '')
            .udf3(request.userId)
            .udf4(request.description || '')
            .udf5('gensy-payment')
            .build()

          // Create payment request using SDK
          const paymentRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(Math.round(request.amount * 100)) // Convert to paise
            .redirectUrl(`${this.APP_URL}/api/payments/callback`)
            .metaInfo(metaInfo)
            .build()

          console.log('📦 SDK Payment request created:', {
            merchantOrderId: merchantTransactionId,
            amount: Math.round(request.amount * 100),
            redirectUrl: `${this.APP_URL}/api/payments/callback`
          })

          // Make payment request using SDK
          const response = await client.pay(paymentRequest)

          console.log('✅ PhonePe SDK response:', response)

          if (response && response.redirectUrl) {
            return {
              success: true,
              merchantTransactionId,
              orderId: response.orderId,
              paymentUrl: response.redirectUrl
            }
          } else {
            throw new Error('No redirect URL received from PhonePe SDK')
          }

        } catch (sdkError) {
          console.error('❌ PhonePe SDK error:', sdkError)
          // Fall through to fallback implementation
        }
      }

      // Fallback to manual API implementation if SDK fails
      console.log('🔄 Falling back to manual API implementation')
      return await this.createPaymentRequestFallback(merchantTransactionId, request)

    } catch (error) {
      console.error('❌ PhonePe payment creation failed:', error)

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }

      // Only use development fallback if explicitly enabled in development mode
      if (process.env.PHONEPE_DEVELOPMENT_MODE === 'true') {
        console.log('🔧 Using development fallback for payment creation (development mode enabled)')
        const fallbackTransactionId = `DEV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        return this.createDevelopmentPaymentResponse(fallbackTransactionId, request)
      }

      // In production mode, return error instead of fake success
      console.error('❌ PhonePe payment failed in production mode. Cannot proceed without real payment.')
      throw new Error('Payment processing failed. Please try again or contact support.')

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
   * Fallback API implementation when SDK is not available
   */
  private static async createPaymentRequestFallback(merchantTransactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    // Prepare payment data according to PhonePe API v1
    const paymentData = {
      merchantId: this.CLIENT_ID,
      merchantTransactionId,
      merchantUserId: request.userId,
      amount: Math.round(request.amount * 100), // Convert to paise
      redirectUrl: `${this.APP_URL}/api/payments/callback`,
      redirectMode: 'POST',
      callbackUrl: `${this.APP_URL}/api/webhooks/phonepe`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    // Encode payload to base64
    const payload = Buffer.from(JSON.stringify(paymentData)).toString('base64')

    // Generate X-VERIFY header
    const endpoint = '/pg/v1/pay'
    const xVerify = this.generateXVerifyHeader(payload, endpoint)

    console.log('Creating PhonePe payment request (fallback):', {
      merchantTransactionId,
      amount: paymentData.amount,
      environment: this.ENVIRONMENT
    })

    // Make API call to PhonePe
    const apiUrl = this.ENVIRONMENT === 'production'
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'

    console.log('🔗 PhonePe API URL:', apiUrl)
    console.log('🔐 X-VERIFY header:', xVerify)
    console.log('📦 Payload:', payload)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        request: payload
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PhonePe API error response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      })
      throw new Error(`PhonePe API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ PhonePe API response:', result)

    if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success: true,
        merchantTransactionId,
        paymentUrl: result.data.instrumentResponse.redirectInfo.url
      }
    } else {
      throw new Error(result.message || 'Payment request failed')
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
