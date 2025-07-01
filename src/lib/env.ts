/**
 * Environment Variables Validation for Gensy AI Creative Suite
 * This file validates and exports all environment variables with proper typing
 */

import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Gensy'),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'Clerk webhook secret is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/auth/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/auth/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/onboarding'),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Google Cloud / Vertex AI Configuration
  GOOGLE_CLOUD_PROJECT_ID: z.string().min(1, 'Google Cloud project ID is required'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_LOCATION: z.string().default('us-central1'),
  GOOGLE_CLOUD_STORAGE_BUCKET: z.string().default('gensy-final'),

  // Cloudflare R2 Storage Configuration
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1, 'Cloudflare R2 access key ID is required'),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1, 'Cloudflare R2 secret access key is required'),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().default('gensy-media'),
  CLOUDFLARE_R2_ENDPOINT: z.string().url('Invalid Cloudflare R2 endpoint'),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().url('Invalid Cloudflare R2 public URL').optional(),

  // Replicate API Configuration
  REPLICATE_API_TOKEN: z.string().min(1, 'Replicate API token is required'),

  // BytePlus ModelArk API Configuration
  BYTEPLUS_API_KEY: z.string().min(1, 'BytePlus API key is required'),
  BYTEPLUS_API_ENDPOINT: z.string().url('Invalid BytePlus API endpoint').default('https://ark.ap-southeast.bytepluses.com/api/v3'),

  // TOS (Torch Object Storage) Configuration for ByteDance video storage
  TOS_ACCESS_KEY_ID: z.string().min(1, 'TOS access key ID is required'),
  TOS_SECRET_ACCESS_KEY: z.string().min(1, 'TOS secret access key is required'),
  TOS_BUCKET_NAME: z.string().min(1, 'TOS bucket name is required'),
  TOS_ENDPOINT: z.string().url('Invalid TOS endpoint').default('https://tos-s3-cn-beijing.volces.com'),
  TOS_REGION: z.string().default('cn-beijing'),

  // OpenRouter API Configuration (for prompt enhancement)
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),

  // PhonePe Payment Gateway Configuration
  PHONEPE_MERCHANT_ID: z.string().min(1, 'PhonePe merchant ID is required'),
  PHONEPE_SALT_KEY: z.string().min(1, 'PhonePe salt key is required'),
  PHONEPE_SALT_INDEX: z.string().default('1'),
  PHONEPE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  PHONEPE_CALLBACK_URL: z.string().default('/api/payments/callback'),

  // Database Configuration
  DATABASE_URL: z.string().url('Invalid database URL').optional(),

  // Redis Configuration
  REDIS_URL: z.string().url('Invalid Redis URL').optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().email('Invalid SMTP user email').optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email('Invalid from email').optional(),

  // Analytics and Monitoring
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),

  // Security Keys
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().length(32, 'Encryption key must be exactly 32 characters'),

  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_VIDEO_GENERATION: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_IMAGE_UPSCALING: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_BATCH_PROCESSING: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_MAX_FILE_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('10'),
  NEXT_PUBLIC_MAX_CREDITS_FREE_TIER: z.string().transform(val => parseInt(val, 10)).default('10'),
})

// Development-friendly environment schema with optional external services
const devEnvSchema = envSchema.extend({
  // Make external service keys optional in development
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_ENDPOINT: z.string().optional(),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  BYTEPLUS_API_KEY: z.string().optional(),
  BYTEPLUS_API_ENDPOINT: z.string().optional(),
  TOS_ACCESS_KEY_ID: z.string().optional(),
  TOS_SECRET_ACCESS_KEY: z.string().optional(),
  TOS_BUCKET_NAME: z.string().optional(),
  TOS_ENDPOINT: z.string().optional(),
  TOS_REGION: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  PHONEPE_MERCHANT_ID: z.string().optional(),
  PHONEPE_SALT_KEY: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const schema = isDev ? devEnvSchema : envSchema
    return schema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')

      // In development, show warning instead of throwing error for external services
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Some external services not configured (development mode):\n${missingVars}`)
        // Return a safe default object for development
        return {
          ...process.env,
          NODE_ENV: 'development',
          NEXT_PUBLIC_APP_NAME: 'Gensy',
          NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
          NEXTAUTH_SECRET: 'dev_nextauth_secret_32_chars_exactly',
          JWT_SECRET: 'dev_jwt_secret_key_32_chars_exactly',
          ENCRYPTION_KEY: 'dev_encryption_key_32_chars_exactly',
          NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/auth/sign-in',
          NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/auth/sign-up',
          NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/dashboard',
          NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/onboarding',
          GOOGLE_CLOUD_LOCATION: 'us-central1',
          CLOUDFLARE_R2_BUCKET_NAME: 'gensy-media',
          PHONEPE_SALT_INDEX: '1',
          PHONEPE_ENVIRONMENT: 'sandbox',
          PHONEPE_CALLBACK_URL: '/api/payments/callback',
          NEXT_PUBLIC_ENABLE_VIDEO_GENERATION: true,
          NEXT_PUBLIC_ENABLE_IMAGE_UPSCALING: true,
          NEXT_PUBLIC_ENABLE_BATCH_PROCESSING: true,
          NEXT_PUBLIC_MAX_FILE_SIZE_MB: 10,
          NEXT_PUBLIC_MAX_CREDITS_FREE_TIER: 10,
        }
      }

      throw new Error(`❌ Invalid environment variables for Gensy:\n${missingVars}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Type for environment variables
export type Env = z.infer<typeof envSchema>

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Feature flag helpers
export const features = {
  videoGeneration: env.NEXT_PUBLIC_ENABLE_VIDEO_GENERATION,
  imageUpscaling: env.NEXT_PUBLIC_ENABLE_IMAGE_UPSCALING,
  batchProcessing: env.NEXT_PUBLIC_ENABLE_BATCH_PROCESSING,
} as const

// Configuration objects
export const config = {
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
    env: env.NODE_ENV,
  },
  clerk: {
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    signInUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    afterSignInUrl: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    afterSignUpUrl: env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  },
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  googleCloud: {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    location: env.GOOGLE_CLOUD_LOCATION,
    credentials: env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  r2: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: env.CLOUDFLARE_R2_BUCKET_NAME,
    endpoint: env.CLOUDFLARE_R2_ENDPOINT,
    publicUrl: env.CLOUDFLARE_R2_PUBLIC_URL,
  },
  replicate: {
    apiToken: env.REPLICATE_API_TOKEN,
  },
  byteplus: {
    apiKey: env.BYTEPLUS_API_KEY,
    apiEndpoint: env.BYTEPLUS_API_ENDPOINT,
  },
  tos: {
    accessKeyId: env.TOS_ACCESS_KEY_ID,
    secretAccessKey: env.TOS_SECRET_ACCESS_KEY,
    bucketName: env.TOS_BUCKET_NAME,
    endpoint: env.TOS_ENDPOINT,
    region: env.TOS_REGION,
  },
  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
  },
  phonepe: {
    merchantId: env.PHONEPE_MERCHANT_ID,
    saltKey: env.PHONEPE_SALT_KEY,
    saltIndex: env.PHONEPE_SALT_INDEX,
    environment: env.PHONEPE_ENVIRONMENT,
    callbackUrl: env.PHONEPE_CALLBACK_URL,
  },
  limits: {
    maxFileSizeMB: env.NEXT_PUBLIC_MAX_FILE_SIZE_MB,
    maxCreditsFreeTier: env.NEXT_PUBLIC_MAX_CREDITS_FREE_TIER,
  },
} as const
