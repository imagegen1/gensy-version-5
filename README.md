# 🎨 Gensy AI Creative Suite

A comprehensive AI-powered creative platform built with Next.js, featuring image generation, video creation, and image upscaling capabilities.

<!-- Fix: Correct Git author to match GitHub account for auto-deploy -->

![Gensy AI Creative Suite](https://via.placeholder.com/800x400/6366f1/ffffff?text=Gensy+AI+Creative+Suite)

## 🚀 Features

- **🎨 AI Image Generation**: Create stunning images from text prompts using advanced AI models
- **🎬 AI Video Generation**: Generate engaging videos from text descriptions  
- **📈 Image Upscaling**: Enhance and upscale images with AI technology
- **🔐 User Authentication**: Secure authentication with Clerk
- **💳 Credit System**: Flexible credit-based usage system
- **📁 File Management**: Cloudflare R2 storage integration
- **📱 Responsive Design**: Modern, mobile-first UI with Tailwind CSS
- **⚡ Real-time Updates**: Live generation status and progress tracking
- **📊 Analytics Dashboard**: Comprehensive usage statistics and insights

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Custom Design System
- **Authentication**: Clerk (Social logins, Session management)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **AI/ML**: Google Vertex AI, Stable Diffusion, Custom Models
- **Deployment**: Vercel (recommended), Docker support
- **Monitoring**: Built-in analytics and error tracking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **yarn 1.22+**
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/gensy.git
cd gensy

# Install dependencies
npm install

# Or use the provided scripts
# Windows:
./run-gensy.bat

# PowerShell:
powershell -ExecutionPolicy Bypass -File run-gensy.ps1
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Clerk Authentication (Get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Configuration (Get from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare R2 Storage (Get from Cloudflare Dashboard)
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=gensy-media
CLOUDFLARE_R2_PUBLIC_URL=https://your-custom-domain.com
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Or use the API endpoint
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}'
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# The app will be available at:
# 🔗 http://localhost:3000
```

## 🏗️ Project Structure

```
gensy/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 api/               # API Routes
│   │   ├── 📁 auth/              # Authentication pages
│   │   ├── 📁 dashboard/         # Main dashboard
│   │   └── 📄 layout.tsx         # Root layout
│   ├── 📁 components/            # React Components
│   │   ├── 📁 ui/               # UI Components Library
│   │   ├── 📁 layout/           # Layout Components
│   │   └── 📁 dashboard/        # Dashboard Components
│   ├── 📁 lib/                   # Utility Libraries
│   │   ├── 📁 auth/             # Authentication utilities
│   │   ├── 📁 database/         # Database utilities
│   │   ├── 📁 storage/          # Storage utilities
│   │   └── 📁 supabase/         # Supabase client
│   └── 📄 middleware.ts          # Next.js middleware
├── 📁 public/                    # Static assets
├── 📄 package.json               # Dependencies
├── 📄 tailwind.config.ts         # Tailwind configuration
└── 📄 next.config.js             # Next.js configuration
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks

# Database
npm run db:migrate      # Run database migrations
npm run db:validate     # Validate database schema
npm run db:seed         # Seed database with sample data
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in dashboard
3. **Deploy** automatically on push to main

### Manual Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

## 📊 API Documentation

Comprehensive API documentation is available at `/src/app/api/README.md`

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch
5. **Open** a Pull Request

## 🆘 Troubleshooting

### Common Issues

1. **Node.js Version**: Ensure you're using Node.js 18+
2. **Environment Variables**: Check all required variables are set
3. **Database Connection**: Verify Supabase credentials
4. **Storage Access**: Confirm Cloudflare R2 permissions

### Getting Help

- 📖 Check the documentation
- 🔍 Search existing issues
- 📧 Create a new issue with detailed information

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the incredible framework
- **Clerk** for seamless authentication
- **Supabase** for the amazing database platform
- **Cloudflare** for reliable R2 storage
- **Google Cloud** for powerful AI services
- **Tailwind CSS** for the utility-first CSS framework

---

<div align="center">
  <p>Made with ❤️ by the Gensy Team</p>
  <p>🚀 Ready to create something amazing? Start with <code>npm run dev</code></p>
</div>
