// Hero Video Configuration
// This file controls the video displayed in the hero section of /landing-page-2

export interface HeroVideoConfig {
  videoSrc: string;
  title: string;
  subtitle: string;
  fallbackImage?: string;
}

export const heroVideoConfig: HeroVideoConfig = {
  // Current video: Hailuo AI Video 02 Model (720p optimized)
  videoSrc: "/videos/hailuo-ai-video-02.mp4.mp4",
  title: "AiNext Video Generation",
  subtitle: "Experience the future of AI-powered video creation with cutting-edge technology",
  fallbackImage: "/ainext-template/assets/img/bg.jpg"
};

// Instructions for changing the hero video:
// 1. Place your new video file in the /public/videos/ directory
// 2. Update the videoSrc path above to point to your new video
// 3. Optionally update the title and subtitle
// 4. The video should be in MP4 format for best browser compatibility
// 5. Recommended aspect ratio: 16:9
// 6. Recommended resolution: 1920x1080 or higher for best quality

export default heroVideoConfig;
