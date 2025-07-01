"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  aspectRatio: number;
  user: {
    name: string;
    avatar: string;
  };
  hasError?: boolean;
}

interface MasonryMediaGalleryProps {
  items?: MediaItem[];
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const CustomSlider = ({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
        className
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-white rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

const MediaCard = ({ item, onClick }: { item: MediaItem; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(item.hasError || false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isValidVideoSrc, setIsValidVideoSrc] = useState(true);
  const [errorType, setErrorType] = useState<'url' | 'load' | null>(null);

  useEffect(() => {
    // Validate video source URL for video items
    if (item.type === 'video') {
      try {
        if (!item.src || item.src.trim() === '') {
          setIsValidVideoSrc(false);
          setHasError(true);
          setErrorType('url');
        } else {
          // Handle both absolute and relative URLs
          if (item.src.startsWith('http') || item.src.startsWith('//')) {
            new URL(item.src); // Validate absolute URLs
          } else if (item.src.startsWith('/')) {
            // Relative URLs starting with / are valid
            new URL(item.src, window.location.origin); // Validate relative URLs
          } else {
            // Invalid URL format
            throw new Error('Invalid URL format');
          }
          setIsValidVideoSrc(true);
          setErrorType(null);
        }
      } catch {
        setIsValidVideoSrc(false);
        setHasError(true);
        setErrorType('url');
      }
    }
  }, [item.src, item.type]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const currentRef = videoRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    const handleVideoPlayback = async () => {
      if (!videoRef.current || item.type !== "video") return;

      try {
        if (isInView) {
          // Only play if video is paused
          if (videoRef.current.paused) {
            await videoRef.current.play();
          }
        } else {
          // Only pause if video is playing
          if (!videoRef.current.paused) {
            videoRef.current.pause();
          }
        }
      } catch (error) {
        // Silently handle autoplay restrictions and other playback errors
        console.debug('Video playback control failed:', error);
      }
    };

    handleVideoPlayback();
  }, [isInView, item.type]);

  return (
    <motion.div
      className="relative break-inside-avoid mb-4 cursor-pointer group"
      style={{ aspectRatio: item.aspectRatio }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg">
        {hasError ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm">
                {item.type === 'video'
                  ? (errorType === 'url' ? 'Invalid video URL' : 'Video unavailable')
                  : `Failed to load ${item.type}`
                }
              </div>
            </div>
          </div>
        ) : item.type === "image" ? (
          <img
            src={item.src}
            alt=""
            className="w-full h-full object-cover"
            onError={() => {
              setHasError(true);
              setErrorType('load');
            }}
          />
        ) : isValidVideoSrc ? (
          <video
            ref={videoRef}
            src={item.src}
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={() => {
              setHasError(true);
              setErrorType('load');
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm">
                {errorType === 'url' ? 'Invalid video URL' : 'Video unavailable'}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-black/30 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-white text-lg font-medium"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                View
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-3 left-3 flex items-center space-x-2">
          <img
            src={item.user.avatar}
            alt={item.user.name}
            className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
          />
          <span className="text-white text-sm font-medium drop-shadow-lg">
            {item.user.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const VideoModal = ({ item, onClose }: { item: MediaItem; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isValidVideoSrc, setIsValidVideoSrc] = useState(true);

  useEffect(() => {
    // Validate video source URL
    try {
      if (!item.src || item.src.trim() === '') {
        setIsValidVideoSrc(false);
        setHasError(true);
      } else {
        // Handle both absolute and relative URLs
        if (item.src.startsWith('http') || item.src.startsWith('//')) {
          new URL(item.src); // Validate absolute URLs
        } else if (item.src.startsWith('/')) {
          // Relative URLs starting with / are valid
          new URL(item.src, window.location.origin); // Validate relative URLs
        } else {
          // Invalid URL format
          throw new Error('Invalid URL format');
        }
        setIsValidVideoSrc(true);
      }
    } catch {
      setIsValidVideoSrc(false);
      setHasError(true);
    }
  }, [item.src]);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.debug('Video toggle play failed:', error);
      // Reset playing state if play failed
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      const newVolume = value / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(progress) ? progress : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (value / 100) * videoRef.current.duration;
      if (isFinite(time)) {
        videoRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-4xl max-h-[90vh] w-full"
        style={{ aspectRatio: item.aspectRatio }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {hasError ? (
          <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg mb-2">Failed to load video</div>
              <div className="text-sm text-gray-400">The video source is not available</div>
            </div>
          </div>
        ) : isValidVideoSrc ? (
          <video
            ref={videoRef}
            src={item.src}
            className="w-full h-full rounded-xl"
            onTimeUpdate={handleTimeUpdate}
            onError={() => setHasError(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
            loop
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg mb-2">Failed to load video</div>
              <div className="text-sm text-gray-400">The video source is not available</div>
            </div>
          </div>
        )}

        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 p-4 bg-black/50 backdrop-blur-md rounded-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-sm">
                  {formatTime(currentTime)}
                </span>
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-white text-sm">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : volume > 0.5 ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <Volume1 className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="w-24">
                      <CustomSlider
                        value={volume * 100}
                        onChange={handleVolumeChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const ImageModal = ({ item, onClose }: { item: MediaItem; onClose: () => void }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-4xl max-h-[90vh] w-full"
        style={{ aspectRatio: item.aspectRatio }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasError ? (
          <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg mb-2">Failed to load image</div>
              <div className="text-sm text-gray-400">The image source is not available</div>
            </div>
          </div>
        ) : (
          <img
            src={item.src}
            alt=""
            className="w-full h-full object-contain rounded-xl"
            onError={() => setHasError(true)}
          />
        )}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

const MasonryMediaGallery = ({ items = [] }: MasonryMediaGalleryProps) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const defaultItems: MediaItem[] = [
    {
      id: "1",
      type: "image",
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
      aspectRatio: 0.67,
      user: { name: "John Doe", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "2",
      type: "video",
      src: "https://videos.pexels.com/video-files/30333849/13003128_2560_1440_25fps.mp4",
      aspectRatio: 1.78,
      user: { name: "Jane Smith", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "3",
      type: "image",
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
      aspectRatio: 1.33,
      user: { name: "Mike Johnson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "4",
      type: "image",
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop",
      aspectRatio: 0.8,
      user: { name: "Sarah Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "5",
      type: "video",
      src: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_25fps.mp4",
      aspectRatio: 1.78,
      user: { name: "Alex Brown", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "6",
      type: "image",
      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop",
      aspectRatio: 0.57,
      user: { name: "Emma Davis", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "7",
      type: "image",
      src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop",
      aspectRatio: 1,
      user: { name: "Chris Lee", avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=40&h=40&fit=crop&crop=face" }
    },
    {
      id: "8",
      type: "image",
      src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop",
      aspectRatio: 1.6,
      user: { name: "Lisa Garcia", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face" }
    }
  ];

  const mediaItems = items.length > 0 ? items : defaultItems;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <>
            {selectedItem.type === "video" ? (
              <VideoModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            ) : (
              <ImageModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasonryMediaGallery;
