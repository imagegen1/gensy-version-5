# Hero Video Configuration

This directory contains the video files used in the hero section of the landing page.

## Current Video
- **Files**:
  - `hailuo-ai-video-02.webm` (Primary - WebM format, better compression)
  - `hailuo-ai-video-02.mp4` (Fallback - MP4 format, broader compatibility)
- **Used in**: `/landing-page-2` hero section
- **Description**: Hailuo AI Video 02 Model demonstration with progressive enhancement

## How to Change the Hero Video

### Step 1: Add Your New Video Files
1. Place your new video files in this `/public/videos/` directory
2. **Recommended formats**: Provide both for optimal performance:
   - **WebM format** (e.g., `your-video.webm`) - Better compression, modern browsers
   - **MP4 format** (e.g., `your-video.mp4`) - Broader compatibility, fallback
3. Recommended aspect ratio: 16:9
4. Recommended resolution: 1920x1080 or higher

### Step 2: Update Configuration
1. Open `/src/config/hero-video.ts`
2. Update the `videoSources` array to point to your new videos:
   ```typescript
   export const heroVideoConfig: HeroVideoConfig = {
     videoSources: [
       {
         src: "/videos/your-video.webm",     // WebM first (progressive enhancement)
         type: "video/webm"
       },
       {
         src: "/videos/your-video.mp4",      // MP4 fallback
         type: "video/mp4"
       }
     ],
     title: "Your New Title",               // Update title if needed
     subtitle: "Your new subtitle text",    // Update subtitle if needed
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
