# Gensy AI Creative Suite API Documentation

This document outlines the API structure and endpoints for the Gensy AI Creative Suite.

## Authentication

All API endpoints require authentication via Clerk. Include the session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

## Base URL

```
https://your-domain.com/api
```

## API Endpoints

### Health & System

#### GET /api/health/supabase
Check Supabase database connectivity and health.

**Response:**
```json
{
  "service": "Gensy AI Creative Suite",
  "component": "Supabase Database",
  "status": "healthy",
  "validation": {
    "isValid": true,
    "errors": []
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### User Management

#### GET /api/user/profile
Get current user profile information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "clerk_user_id": "clerk_id",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "credits": 100,
    "subscription_status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /api/user/profile
Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### GET /api/user/credits
Get user's current credit balance.

**Response:**
```json
{
  "success": true,
  "credits": 100,
  "hasCredits": true
}
```

#### POST /api/user/credits
Add credits to user account (for purchases/bonuses).

**Request Body:**
```json
{
  "amount": 50,
  "type": "purchase",
  "description": "Credit purchase",
  "payment_id": "payment_123"
}
```

#### GET /api/user/stats
Get user statistics and analytics.

**Query Parameters:**
- `period` (optional): "all", "month", "week"

**Response:**
```json
{
  "success": true,
  "stats": {
    "user": {
      "id": "uuid",
      "credits": 100,
      "subscription_status": "active"
    },
    "generations": {
      "total_generations": 50,
      "image_generations": 30,
      "video_generations": 15,
      "upscale_generations": 5,
      "total_credits_used": 75,
      "avg_processing_time": 45.5
    },
    "storage": {
      "totalFiles": 25,
      "totalSize": 1048576,
      "imageFiles": 20,
      "videoFiles": 5
    }
  }
}
```

### File Upload & Storage

#### POST /api/upload
Upload a file to Cloudflare R2 storage.

**Request:** Multipart form data
- `file`: File to upload
- `generationId` (optional): Associated generation ID
- `isPublic` (optional): Make file publicly accessible
- `prefix` (optional): Storage prefix/folder

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "key": "uploads/user_id/timestamp_filename.ext",
    "url": "https://...",
    "size": 1048576,
    "contentType": "image/jpeg",
    "generationId": "uuid"
  }
}
```

#### GET /api/upload
Get user's uploaded files with pagination.

**Query Parameters:**
- `limit` (optional): Number of files to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by MIME type prefix (e.g., "image", "video")
- `generationId` (optional): Filter by generation ID

#### POST /api/upload/presigned
Get a presigned URL for direct client uploads.

**Request Body:**
```json
{
  "fileName": "image.jpg",
  "contentType": "image/jpeg",
  "fileSize": 1048576,
  "prefix": "uploads"
}
```

**Response:**
```json
{
  "success": true,
  "uploadUrl": "https://...",
  "fileKey": "uploads/user_id/timestamp_filename.ext",
  "fields": {
    "Content-Type": "image/jpeg"
  },
  "expiresIn": 3600
}
```

#### DELETE /api/upload/[fileId]
Delete a specific file.

#### PATCH /api/upload/[fileId]
Update file metadata.

**Request Body:**
```json
{
  "width": 1920,
  "height": 1080,
  "duration": 30.5,
  "isPublic": true
}
```

### AI Generations

#### GET /api/generations
Get user's AI generations with pagination.

**Query Parameters:**
- `limit` (optional): Number of generations to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by type ("image", "video", "upscale")
- `status` (optional): Filter by status ("pending", "processing", "completed", "failed")

**Response:**
```json
{
  "success": true,
  "generations": [
    {
      "id": "uuid",
      "type": "image",
      "prompt": "A beautiful sunset",
      "model_used": "stable-diffusion-xl",
      "status": "completed",
      "result_url": "https://...",
      "credits_used": 1,
      "processing_time_seconds": 45,
      "created_at": "2024-01-01T00:00:00.000Z",
      "media_files": [
        {
          "id": "uuid",
          "filename": "generated_image.jpg",
          "file_size": 1048576,
          "width": 1024,
          "height": 1024
        }
      ]
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

#### POST /api/generations
Create a new AI generation request.

**Request Body:**
```json
{
  "type": "image",
  "prompt": "A beautiful sunset over mountains",
  "model_used": "stable-diffusion-xl",
  "credits_required": 1,
  "metadata": {
    "style": "realistic",
    "aspect_ratio": "16:9"
  }
}
```

**Response:**
```json
{
  "success": true,
  "generation": {
    "id": "uuid",
    "type": "image",
    "prompt": "A beautiful sunset over mountains",
    "status": "pending",
    "credits_used": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Generation queued successfully"
}
```

#### GET /api/generations/[generationId]
Get a specific generation with details.

#### PATCH /api/generations/[generationId]
Update generation status (typically used by background workers).

**Request Body:**
```json
{
  "status": "completed",
  "result_url": "https://...",
  "processing_time_seconds": 45
}
```

#### DELETE /api/generations/[generationId]
Delete a specific generation and associated files.

### Webhooks

#### POST /api/webhooks/clerk
Clerk webhook handler for user lifecycle events.

**Headers:**
- `svix-id`: Webhook ID
- `svix-timestamp`: Webhook timestamp
- `svix-signature`: Webhook signature

### Admin Routes

#### POST /api/admin/migrate
Run database migrations (admin only).

**Request Body:**
```json
{
  "action": "migrate" | "validate" | "seed"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `402`: Payment Required (insufficient credits)
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- User endpoints: 100 requests per minute
- Upload endpoints: 20 requests per minute
- Generation endpoints: 10 requests per minute

## File Size Limits

- Images: 50MB maximum
- Videos: 100MB maximum
- Total storage per user: 10GB (free tier), unlimited (paid tiers)

## Supported File Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Videos
- MP4 (.mp4)
- WebM (.webm)
