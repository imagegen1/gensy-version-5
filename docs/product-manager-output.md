# Gensy AI Creative Suite - Product Requirements Document (PRD)

## 1. Executive Summary

**Gensy AI Creative Suite** is a comprehensive AI-powered creative platform that democratizes access to professional-grade content creation tools. The platform enables users to generate high-quality images and videos from text prompts, upscale existing images, and manage their creative assets through an intuitive web interface.

### Value Proposition
- **AI-First Creative Platform**: Leverages cutting-edge AI models from Google Vertex AI, ByteDance, Black Forest Labs, and MiniMax
- **Credit-Based Economy**: Transparent, usage-based pricing model with flexible subscription tiers
- **Professional Quality**: Enterprise-grade infrastructure with Cloudflare R2 storage and Supabase database
- **Indian Market Focus**: INR-based pricing optimized for the Indian creative market

## 2. Product Overview

### Core Platform
Gensy is a Next.js 15-based web application that provides AI-powered creative tools through a modern, responsive interface. The platform integrates multiple AI service providers to offer diverse creative capabilities while maintaining a unified user experience.

### Key Differentiators
- **Multi-Provider AI Integration**: Access to Google Veo 3.0, Imagen 4, ByteDance Seedream, BFL Flux, and MiniMax models
- **Intelligent Style Analysis**: Automatic style detection and recommendations from reference images
- **Unified Gallery Experience**: Masonry-style gallery for managing both images and videos
- **Credit-Based Transparency**: Clear pricing with 55% gross margin structure

## 3. Target Market & User Personas

### Primary Market: Indian Creative Professionals
- **Market Size**: Growing digital content creation market in India
- **Price Sensitivity**: INR-based pricing starting at ₹360/year (Starter plan)
- **Use Cases**: Social media content, marketing materials, creative exploration

### User Personas

#### 1. **Creative Beginner** (Starter Plan - ₹360/year)
- **Profile**: Students, hobbyists, social media enthusiasts
- **Needs**: Basic image/video generation, learning AI tools
- **Usage**: 1,500 credits/month (~750 images or 300 videos)

#### 2. **Professional Creator** (Pro Plan - ₹937/year)
- **Profile**: Freelancers, small agencies, content creators
- **Needs**: Regular content production, advanced features
- **Usage**: 3,904 credits/month (~1,952 images or 781 videos)

#### 3. **Business User** (Business Plan - ₹4,185/year)
- **Profile**: Marketing teams, design agencies, enterprises
- **Needs**: High-volume production, team collaboration
- **Usage**: 17,437 credits/month (~8,718 images or 3,487 videos)

#### 4. **Enterprise Client** (Enterprise Plan - ₹8,850/year)
- **Profile**: Large organizations, production studios
- **Needs**: Maximum capacity, priority support, API access
- **Usage**: 36,875 credits/month (~18,437 images or 7,375 videos)

## 4. Feature Analysis

### 4.1 AI Image Generation
**Status**: ✅ Fully Implemented

#### Supported Models & Providers
| Provider | Model | Credits | Capabilities |
|----------|-------|---------|-------------|
| Google Vertex AI | Imagen 4 | 2-3 | High-quality, multiple aspect ratios |
| Google Vertex AI | Imagen 4 Fast | 2 | Fast generation, good quality |
| Google Vertex AI | Imagen 4 Ultra | 3 | Ultra-high quality, 2048x2048 |
| ByteDance | Seedream 3.0 | 2 | Artistic styles, watermark control |
| Black Forest Labs | Flux Pro | 3 | Professional quality, advanced controls |

#### Key Features
- **Aspect Ratio Support**: 1:1, 16:9, 9:16, 4:3, 3:4
- **Style Options**: Realistic, Artistic, Cartoon, Abstract, Photographic, Cinematic
- **Quality Levels**: Standard, High, Ultra
- **Advanced Controls**: Guidance scale, seed control, negative prompts
- **Intelligent Style Analysis**: Automatic style detection from reference images

### 4.2 AI Video Generation
**Status**: ✅ Fully Implemented

#### Supported Models & Providers
| Provider | Model | Credits | Duration | Capabilities |
|----------|-------|---------|----------|-------------|
| Google Vertex AI | Veo 2.0 | 15 | 8s | Text-to-video, Image-to-video |
| Google Vertex AI | Veo 3.0 | 20 | 8s | Ultra-quality, Audio generation |
| Google Vertex AI | Veo 3.0 Fast | 15 | 8s | Fast generation, 720p/1080p |
| MiniMax | Hailuo | 10-15 | 5-10s | Text/Image-to-video |
| ByteDance | Seedance | 12 | 6s | Professional video generation |

#### Key Features
- **Generation Modes**: Text-to-video, Image-to-video, Frame-to-video
- **Resolution Support**: 720p, 1080p (model dependent)
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Style Controls**: Realistic, Artistic, Cinematic, Documentary
- **Motion Intensity**: Low, Medium, High settings

### 4.3 Image Upscaling
**Status**: ✅ Implemented

#### Upscaling Options
| Model | Credits | Enhancement Types |
|-------|---------|------------------|
| Vertex AI Standard | 2 | Denoise, Sharpen |
| Vertex AI Enhanced | 3 | AI-Enhanced, Colorize, Denoise, Sharpen |

### 4.4 Credit System & Pricing
**Status**: ✅ Fully Implemented

#### Credit Economics
- **Credit Value**: ₹0.02 per credit
- **Gross Margin**: 55% target margin
- **Cost Structure**: API costs + storage costs + margin

#### Subscription Plans (Annual)
| Plan | Price (INR/year) | Credits/Month | Target User |
|------|------------------|---------------|-------------|
| Starter | ₹360 | 18,000 | Beginners |
| Pro | ₹937 | 46,850 | Professionals |
| Business | ₹4,185 | 209,250 | Teams |
| Enterprise | ₹8,850 | 442,500 | Large Organizations |

#### Pay-as-you-go Options
| Package | Credits | Price (INR) | Bonus |
|---------|---------|-------------|-------|
| Small | 500 | ₹10 | 0% |
| Medium | 1,250 | ₹25 | 25% |
| Large | 2,750 | ₹50 | 37.5% |
| Mega | 6,000 | ₹100 | 50% |

### 4.5 User Authentication & Management
**Status**: ✅ Implemented with Clerk

#### Features
- **Social Login**: Google, GitHub, email/password
- **Session Management**: Secure JWT-based authentication
- **User Profiles**: Credit balance, subscription status, usage analytics
- **Role-Based Access**: Different feature access based on subscription tier

### 4.6 File Storage & Management
**Status**: ✅ Implemented with Cloudflare R2

#### Storage Architecture
- **Primary Storage**: Cloudflare R2 (S3-compatible)
- **CDN**: Global content delivery for fast access
- **File Types**: JPEG, PNG, MP4, WebM
- **Retention**: Permanent storage for user-generated content

### 4.7 Gallery & Asset Management
**Status**: ✅ Advanced Implementation

#### Gallery Features
- **Unified Gallery**: Combined image and video management
- **View Modes**: Masonry, Grid, List layouts
- **Filtering**: By type, date, model, style
- **Sorting**: Date, popularity, credits used
- **Interactions**: Like, share, download, delete
- **Metadata**: Generation parameters, model used, credits consumed

## 5. Technical Architecture

### 5.1 Frontend Stack
- **Framework**: Next.js 15 with React 18
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Custom component library with shadcn/ui
- **State Management**: React hooks and context

### 5.2 Backend Infrastructure
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Clerk for user management
- **Storage**: Cloudflare R2 for file storage
- **Payments**: PhonePe integration for Indian market
- **Monitoring**: Sentry for error tracking and performance

### 5.3 AI Service Integrations
- **Google Cloud Vertex AI**: Primary AI provider
- **ByteDance ModelArk**: Alternative image/video generation
- **Black Forest Labs**: Premium image generation
- **MiniMax**: Video generation capabilities

### 5.4 Deployment & Hosting
- **Platform**: Vercel for frontend deployment
- **CDN**: Global edge network for performance
- **Environment**: Production, staging, development environments
- **CI/CD**: GitHub Actions for automated deployment

## 6. User Experience & Flows

### 6.1 Core User Journeys

#### Image Generation Flow
1. **Access**: Navigate to /generate/image
2. **Input**: Enter text prompt or upload reference image
3. **Configure**: Select model, style, aspect ratio, quality
4. **Generate**: Submit request with credit validation
5. **Monitor**: Real-time progress tracking
6. **Review**: View result with generation metadata
7. **Manage**: Save to gallery, share, or regenerate

#### Video Generation Flow
1. **Access**: Navigate to /video
2. **Mode Selection**: Text-to-video or Image-to-video
3. **Input**: Provide prompt and/or reference image
4. **Configure**: Model, duration, resolution, style
5. **Generate**: Submit with credit deduction
6. **Progress**: Long-running job with status updates
7. **Result**: Video player with download options

#### Subscription Flow
1. **Pricing**: View plans at /pricing
2. **Selection**: Choose plan and billing cycle
3. **Payment**: PhonePe integration for Indian users
4. **Activation**: Immediate credit allocation
5. **Management**: View usage and renewal options

### 6.2 Dashboard Experience
- **Welcome Section**: Personalized greeting with credit balance
- **Quick Actions**: Direct access to generation tools
- **Usage Statistics**: Visual analytics of generations and credits
- **Recent Activity**: Latest generations and transactions
- **Gallery Preview**: Recent creations with quick access

## 7. Business Model

### 7.1 Revenue Streams

#### Primary: Subscription Revenue
- **Annual Subscriptions**: 75% of revenue (estimated)
- **Monthly Subscriptions**: 25% premium pricing (25% higher rates)
- **Predictable Revenue**: Recurring subscription model

#### Secondary: Pay-as-you-go
- **Credit Packages**: Flexible usage for occasional users
- **Bonus Structure**: Incentivizes larger purchases
- **Market Expansion**: Attracts price-sensitive users

### 7.2 Pricing Strategy
- **Cost-Plus Model**: 55% gross margin target
- **Market Positioning**: Premium quality at competitive Indian pricing
- **Value Tiers**: Clear differentiation between plan levels
- **Localization**: INR pricing optimized for Indian purchasing power

### 7.3 Unit Economics
- **Customer Acquisition Cost (CAC)**: To be measured
- **Lifetime Value (LTV)**: Estimated 12-24 months retention
- **Gross Margin**: 55% target across all services
- **Churn Rate**: To be optimized through feature development

## 8. Competitive Analysis

### 8.1 Market Position
**Premium AI Creative Suite** positioned between basic AI tools and enterprise solutions

### 8.2 Competitive Advantages
1. **Multi-Provider Integration**: Access to latest AI models
2. **Indian Market Focus**: Localized pricing and payment methods
3. **Unified Experience**: Single platform for images and videos
4. **Transparent Pricing**: Clear credit-based model
5. **Professional Quality**: Enterprise-grade infrastructure

### 8.3 Key Competitors
- **Midjourney**: Image generation focus, Discord-based
- **Runway**: Video generation leader, higher pricing
- **Stable Diffusion**: Open-source, technical complexity
- **Adobe Firefly**: Enterprise focus, subscription model
- **Canva**: Design focus, limited AI capabilities

### 8.4 Differentiation Strategy
- **Accessibility**: Web-based, no technical expertise required
- **Affordability**: Competitive pricing for Indian market
- **Comprehensiveness**: Full creative suite vs. single-purpose tools
- **Quality**: Premium AI models with professional results

## 9. Success Metrics & KPIs

### 9.1 Business Metrics
- **Monthly Recurring Revenue (MRR)**: Primary revenue indicator
- **Customer Acquisition Rate**: New user signups per month
- **Conversion Rate**: Free to paid subscription conversion
- **Churn Rate**: Monthly subscription cancellation rate
- **Average Revenue Per User (ARPU)**: Revenue efficiency metric

### 9.2 Product Metrics
- **Generation Volume**: Total images/videos created monthly
- **Credit Utilization**: Average credits used per user
- **Feature Adoption**: Usage rates for different AI models
- **User Engagement**: Daily/Monthly active users
- **Session Duration**: Time spent on platform

### 9.3 Technical Metrics
- **Generation Success Rate**: Successful AI generations (>95% target)
- **Response Time**: Average generation completion time
- **Uptime**: Platform availability (99.9% target)
- **Error Rate**: Failed requests (<1% target)

### 9.4 User Experience Metrics
- **Net Promoter Score (NPS)**: User satisfaction indicator
- **User Retention**: 30-day, 90-day retention rates
- **Support Ticket Volume**: Customer service efficiency
- **Feature Request Volume**: Product development insights

## 10. Roadmap & Future Considerations

### 10.1 Short-term Enhancements (Q1-Q2 2025)
- **API Access**: Developer API for enterprise customers
- **Batch Processing**: Multiple image processing capabilities
- **Advanced Analytics**: Detailed usage insights and reporting
- **Mobile Optimization**: Enhanced mobile web experience
- **Team Collaboration**: Shared workspaces and asset management

### 10.2 Medium-term Expansion (Q3-Q4 2025)
- **Audio Generation**: AI-powered music and sound effects
- **3D Model Generation**: Three-dimensional asset creation
- **Video Editing**: AI-assisted video editing capabilities
- **Template Library**: Pre-designed templates for common use cases
- **Integration Ecosystem**: Third-party app integrations

### 10.3 Long-term Vision (2026+)
- **Mobile Applications**: Native iOS and Android apps
- **Enterprise Features**: Advanced team management and billing
- **Custom Model Training**: User-specific AI model fine-tuning
- **Marketplace**: User-generated content and template sharing
- **Global Expansion**: Multi-currency and multi-language support

### 10.4 Strategic Considerations
- **AI Model Evolution**: Continuous integration of latest AI capabilities
- **Regulatory Compliance**: AI ethics and content moderation
- **Scalability**: Infrastructure scaling for user growth
- **Competitive Response**: Feature parity with emerging competitors
- **Market Expansion**: Geographic and demographic growth opportunities

---

*This PRD reflects the current state of Gensy AI Creative Suite as of January 2025, based on comprehensive codebase analysis and market positioning assessment.*
