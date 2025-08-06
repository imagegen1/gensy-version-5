// Hero Video Configuration
// This file controls the video displayed in the hero section of /landing-page-2

export interface VideoSource {
  src: string;
  type: string;
}

export interface HeroVideoConfig {
  videoSources: VideoSource[];
  title: string;
  subtitle: string;
  fallbackImage?: string;
}

export const heroVideoConfig: HeroVideoConfig = {
  // Current video: Hailuo AI Video 02 Model (720p optimized)
  // Using progressive enhancement: WebM first (better compression), MP4 fallback (broader compatibility)
  videoSources: [
    {
      src: "/videos/hailuo-ai-video-02.webm",
      type: "video/webm"
    },
    {
      src: "/videos/hailuo-ai-video-02.mp4",
      type: "video/mp4"
    }
  ],
  title: "AiNext Video Generation",
  subtitle: "Experience the future of AI-powered video creation with cutting-edge technology",
  // Removed fallbackImage to prevent placeholder from showing
  // fallbackImage: "/ainext-template/assets/img/bg.jpg"
};

// Instructions for changing the hero video:
// 1. Place your new video files in the /public/videos/ directory
// 2. For best performance, provide both WebM and MP4 formats:
//    - filename.webm (better compression, modern browsers)
//    - filename.mp4 (broader compatibility, fallback)
// 3. Update the videoSources array above with your new video paths
// 4. List WebM source first for progressive enhancement
// 5. Optionally update the title and subtitle
// 6. Recommended aspect ratio: 16:9
// 7. Recommended resolution: 1920x1080 or higher for best quality

export default heroVideoConfig;
