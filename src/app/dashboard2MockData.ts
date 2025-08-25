// Mock data for the dashboard gallery

// Props types (data passed to components)
export interface GalleryImage {
  id: string;
  username: string;
  avatar: string;
  images: string[];
  timestamp: string;
}

export interface PromotionalBanner {
  id: string;
  type: "open-source" | "new-tool";
  title: string;
  heading: string;
  description: string;
  ctaText: string;
  backgroundImage: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  gradient?: string;
  isNew?: boolean;
}

export interface DashboardProps {
  galleryImages: GalleryImage[];
  promotionalBanners: PromotionalBanner[];
  toolCategories: ToolCategory[];
  alertMessage: string;
  showAlert: boolean;
}

// Data passed as props to the root component
export const mockRootProps: DashboardProps = {
  galleryImages: [
    {
      id: "1",
      username: "frog",
      avatar: "/dashboard/avatars/frog-avatar.png",
      images: ["/dashboard/gallery/frog-image-1.png"],
      timestamp: "2024-01-15T10:30:00Z"
    },
    {
      id: "2", 
      username: "captivatingfragrantmarmot",
      avatar: "/dashboard/avatars/captivatingfragrantmarmot-avatar.png",
      images: ["/dashboard/gallery/captivatingfragrantmarmot-image-1.png"],
      timestamp: "2024-01-15T11:15:00Z"
    },
    {
      id: "3",
      username: "B655321", 
      avatar: "/dashboard/avatars/b655321-avatar.png",
      images: [],
      timestamp: "2024-01-15T12:00:00Z"
    },
    {
      id: "4",
      username: "sithragnar",
      avatar: "/dashboard/avatars/sithragnar-avatar.png", 
      images: ["/dashboard/gallery/sithragnar-image-1.png", "/dashboard/gallery/sithragnar-image-2.png", "/dashboard/gallery/sithragnar-image-3.png"],
      timestamp: "2024-01-15T13:20:00Z"
    },
    {
      id: "5",
      username: "critical_beat",
      avatar: "/dashboard/avatars/critical-beat-avatar.png",
      images: ["/dashboard/gallery/critical-beat-image-1.png", "/dashboard/gallery/critical-beat-image-2.png", "/dashboard/gallery/critical-beat-image-3.png"],
      timestamp: "2024-01-15T14:45:00Z"
    },
    {
      id: "6",
      username: "boringbotlab",
      avatar: "/dashboard/avatars/boringbotlab-avatar.png",
      images: ["/dashboard/gallery/boringbotlab-image-1.png", "/dashboard/gallery/boringbotlab-image-2.png"],
      timestamp: "2024-01-15T15:30:00Z"
    },
    {
      id: "7",
      username: "ShadowBear",
      avatar: "/dashboard/avatars/shadowbear-avatar.png", 
      images: ["/dashboard/gallery/shadowbear-image-1.png"],
      timestamp: "2024-01-15T16:10:00Z"
    },
    {
      id: "8",
      username: "brocokira",
      avatar: "/dashboard/avatars/brocokira-avatar.png",
      images: ["/dashboard/gallery/brocokira-image-1.png"],
      timestamp: "2024-01-15T17:25:00Z"
    },
    {
      id: "9",
      username: "CSDSGN",
      avatar: "/dashboard/avatars/csdsgn-avatar.png",
      images: ["/dashboard/gallery/csdsgn-image-1.png"],
      timestamp: "2024-01-15T18:40:00Z"
    },
    {
      id: "10",
      username: "Sabinamalina",
      avatar: "/dashboard/avatars/sabinamalina-avatar.png",
      images: ["/dashboard/gallery/sabinamalina-image-1.png"],
      timestamp: "2024-01-15T19:15:00Z"
    }
  ],
  promotionalBanners: [
    {
      id: "flux-krea",
      type: "open-source" as const,
      title: "Open Source Model",
      heading: "FLUX.1 Krea",
      description: "We're making the weights to our FLUX.1 Krea model open-source.\nDownload and run our model weights, read the technical report, or\ngenerate with it in Krea Image.",
      ctaText: "Read report",
      backgroundImage: "/dashboard/banners/flux-krea-background.jpg"
    },
    {
      id: "motion-transfer",
      type: "new-tool" as const,
      title: "New tool", 
      heading: "Introducing Motion Transfer",
      description: "Bring motion into your characters. Upload any image, record a video\nof yourself, and make your characters smile, talk, and dance.\nPowered by Runway Act 2.",
      ctaText: "Open",
      backgroundImage: "/dashboard/banners/motion-transfer-background.jpg"
    }
  ],
  toolCategories: [
    {
      id: "image",
      name: "Image",
      description: "Generate images with custom styles\nin Flux and Ideogram.",
      gradient: "linear-gradient(0deg, rgba(208,227,241,1) 0% , rgba(41,73,98,1) 100%)"
    },
    {
      id: "video", 
      name: "Video",
      description: "Generate videos with Hailuo, Pika,\nRunway, Luma, and more.",
      gradient: "#ffa700"
    },
    {
      id: "realtime",
      name: "Realtime", 
      description: "Realtime AI rendering on a canvas.\nInstant feedback loops.",
      gradient: "linear-gradient(0deg, rgba(229,229,229,1) 0% , rgba(0,210,255,1) 35% , rgba(0,157,241,1) 100%)"
    },
    {
      id: "enhancer",
      name: "Enhancer",
      description: "Upscale and enhance images and\nvideos up to 22K.", 
      gradient: "linear-gradient(0deg, rgba(136,136,136,1) 0% , rgba(0,0,0,1) 100%)"
    },
    {
      id: "edit",
      name: "Edit",
      description: "Add objects, change style, or expand\nphotos and generations.",
      gradient: "linear-gradient(0deg, rgba(174,145,202,1) 0% , rgba(89,42,133,1) 60% , rgba(24,7,40,1) 100%)"
    },
    {
      id: "video-lipsync",
      name: "Video Lipsync",
      description: "Lip sync any video to any audio.",
      gradient: "linear-gradient(0deg, rgba(187,202,145,1) 0% , rgba(60,135,143,1) 60% , rgba(7,40,15,1) 100%)"
    },
    {
      id: "motion-transfer",
      name: "Motion Transfer", 
      description: "Transfer motion to images and\nanimate characters.",
      gradient: "#1b1c1d"
    },
    {
      id: "train",
      name: "Train",
      description: "Teach Krea to replicate your style,\nproducts, or characters.",
      isNew: true
    }
  ],
  alertMessage: "Heads up! You've utlized over 90% of your compute time",
  showAlert: true
};