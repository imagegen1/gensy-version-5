# Gensy AI Creative Suite - Vercel Deployment Guide

## 🚀 Pre-Deployment Checklist

### ✅ Required Environment Variables for Vercel

Set these environment variables in your Vercel dashboard:

#### **Essential Variables (Required)**
```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Gensy
NODE_ENV=production

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_clerk_key
CLERK_SECRET_KEY=sk_live_your_production_clerk_secret
CLERK_WEBHOOK_SECRET=whsec_your_production_webhook_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Google Cloud / Vertex AI Configuration (IMPORTANT: Use Base64)
GOOGLE_CLOUD_PROJECT_ID=gensy-final-464206
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsLi4u
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=gensy-final

# Cloudflare R2 Storage Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_production_r2_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_production_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=gensy-production
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://your-production-domain.com
```

#### **API Keys (Required for Full Functionality)**
```bash
# BytePlus API Configuration
BYTEPLUS_API_KEY=your_byteplus_api_key
BYTEPLUS_API_ENDPOINT=https://ark.ap-southeast.bytepluses.com/api/v3

# TOS Configuration (for ByteDance video storage)
TOS_ACCESS_KEY_ID=your_tos_access_key
TOS_SECRET_ACCESS_KEY=your_tos_secret_key
TOS_BUCKET_NAME=your_tos_bucket
TOS_ENDPOINT=https://tos-s3-cn-beijing.volces.com
TOS_REGION=cn-beijing

# Replicate API Configuration
REPLICATE_API_TOKEN=r8_your_production_replicate_token

# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your_production_openrouter_key
```

#### **Payment & Optional Services**
```bash
# PhonePe Payment Gateway (if using payments)
PHONEPE_MERCHANT_ID=your_production_merchant_id
PHONEPE_SALT_KEY=your_production_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_ENVIRONMENT=production
PHONEPE_CALLBACK_URL=/api/payments/callback
```

## 🔧 Deployment Steps

### 1. **Prepare Your Repository**
```bash
# Ensure all changes are committed and pushed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

### 2. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Import the `gensy-version-5` project
4. Configure environment variables (see list above)
5. Deploy!

### 3. **Post-Deployment Configuration**

#### **Update Clerk URLs**
In your Clerk dashboard, update:
- **Authorized domains**: Add your Vercel domain
- **Webhook endpoints**: Update to your Vercel domain

#### **Update Supabase Settings**
In your Supabase dashboard:
- **Site URL**: Update to your Vercel domain
- **Additional redirect URLs**: Add Vercel domain

#### **Test Critical Endpoints**
After deployment, test these endpoints:
- `/api/test/google-auth` - Google Cloud authentication
- `/api/generate/video` - Video generation
- `/api/generate/image` - Image generation

## 🔍 Troubleshooting

### Common Issues:

#### **Google Cloud Authentication Fails**
- Ensure `GOOGLE_CREDENTIALS_BASE64` is set (not `GOOGLE_APPLICATION_CREDENTIALS`)
- Verify the Base64 string is complete and unbroken
- Test with `/api/test/google-auth`

#### **Build Fails**
- Check that all required environment variables are set
- Verify TypeScript errors are resolved
- Check Next.js build logs in Vercel dashboard

#### **API Routes Timeout**
- Increase function timeout in `vercel.json` (already configured to 300s)
- Optimize heavy operations
- Consider using background jobs for long-running tasks

## 📊 Performance Optimization

### **Recommended Vercel Settings**
- **Function Region**: Choose closest to your users
- **Edge Functions**: Consider for static content
- **Analytics**: Enable Vercel Analytics
- **Speed Insights**: Enable for performance monitoring

### **Environment-Specific Optimizations**
- Use production API keys (not development/test keys)
- Enable caching for static assets
- Configure CDN for media files
- Set up proper error monitoring

## 🔐 Security Checklist

- [ ] All environment variables use production values
- [ ] No development keys in production
- [ ] CORS settings are properly configured
- [ ] Webhook secrets are production values
- [ ] Database access is restricted to production
- [ ] API rate limiting is enabled

## 📈 Monitoring

After deployment, monitor:
- **Vercel Analytics**: User traffic and performance
- **Function Logs**: API endpoint performance
- **Error Tracking**: Any runtime errors
- **Database Performance**: Supabase metrics
- **Storage Usage**: Cloudflare R2 usage

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Application loads without errors
- [ ] User authentication works (Clerk)
- [ ] Database operations work (Supabase)
- [ ] Google Cloud services work (test endpoint)
- [ ] Video generation works (ByteDance)
- [ ] Image generation works (Replicate/Google)
- [ ] File storage works (Cloudflare R2)
