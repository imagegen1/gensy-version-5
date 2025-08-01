# Hero Video Configuration

This directory contains the video files used in the hero section of the landing page.

## Current Video
- **File**: `hailuo-ai-video-02.mp4`
- **Used in**: `/landing-page-2` hero section
- **Description**: Hailuo AI Video 02 Model demonstration

## How to Change the Hero Video

### Step 1: Add Your New Video
1. Place your new video file in this `/public/videos/` directory
2. Recommended format: MP4
3. Recommended aspect ratio: 16:9
4. Recommended resolution: 1920x1080 or higher

### Step 2: Update Configuration
1. Open `/src/config/hero-video.ts`
2. Update the `videoSrc` field to point to your new video:
   ```typescript
   export const heroVideoConfig: HeroVideoConfig = {
     videoSrc: "/videos/your-new-video.mp4", // Update this path
     title: "Your New Title",                // Update title if needed
     subtitle: "Your new subtitle text",     // Update subtitle if needed
     fallbackImage: "/ainext-template/assets/img/bg.jpg"
   };
   ```

### Step 3: Test the Changes
1. Save the configuration file
2. The video will automatically update on the landing page
3. Visit `http://localhost:3000/landing-page-2` to see the changes

## Video Requirements
- **Format**: MP4 (best browser compatibility)
- **Aspect Ratio**: 16:9 (recommended)
- **Resolution**: 1920x1080 or higher
- **Duration**: Any length (video will loop automatically)
- **Audio**: Not required (video plays muted by default)

## Technical Notes
- Videos play automatically, muted, and loop continuously
- The video is responsive and will scale to fit different screen sizes
- A dark overlay is applied over the video for better text readability
- The video serves as a background with text content overlaid on top

## File Naming Convention
Use descriptive names for your video files:
- `hailuo-ai-video-02.mp4` (current)
- `product-demo-v1.mp4`
- `ai-showcase-2024.mp4`
- etc.

## Troubleshooting
- If video doesn't play, check the file path in the configuration
- Ensure the video file is in MP4 format
- Large video files may take time to load - consider optimizing file size
- Test on different browsers to ensure compatibility
