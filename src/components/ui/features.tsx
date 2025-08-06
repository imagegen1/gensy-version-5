"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";


interface FeaturesProps {
  features: {
    id: number;
    icon: React.ElementType;
    title: string;
    description: string;
    image: string;
  }[];
  primaryColor?: string;
  progressGradientLight?: string;
  progressGradientDark?: string;
}

export function Features({
  features,
  primaryColor,
  progressGradientLight,
  progressGradientDark,
}: FeaturesProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }, 200);
    }
  }, [progress]);

  useEffect(() => {
    const activeFeatureElement = featureRefs.current[currentFeature];
    const container = containerRef.current;

    if (activeFeatureElement && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeFeatureElement.getBoundingClientRect();

      container.scrollTo({
        left:
          activeFeatureElement.offsetLeft -
          (containerRect.width - elementRect.width) / 2,
        behavior: "smooth",
      });
    }
  }, [currentFeature]);

  const handleFeatureClick = (index: number) => {
    setCurrentFeature(index);
    setProgress(0);
  };

  return (
    <div className="w-full py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span
            className={`text-cyan-400 font-semibold text-sm uppercase tracking-wider`}
          >
            AI-Powered Creation
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Image Generation Models
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Experience cutting-edge AI image generation with our premium model collection
          </p>
        </div>

        <div className="grid lg:grid-cols-2 lg:gap-16 gap-8 items-center">
          {/* Left Side - Features with Progress Lines */}
          <div
            ref={containerRef}
            className="lg:space-y-6 space-y-4 lg:overflow-visible order-1"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = currentFeature === index;

              return (
                <div
                  key={feature.id}
                  ref={(el) => {
                    featureRefs.current[index] = el;
                  }}
                  className="relative cursor-pointer"
                  onClick={() => handleFeatureClick(index)}
                >
                  {/* Feature Content */}
                  <div
                    className={`
                    flex items-start space-x-4 p-6 w-full transition-all duration-300 rounded-xl
                    ${
                      isActive
                        ? "bg-white/20 backdrop-blur-sm shadow-lg border border-cyan-400/50"
                        : "bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/20"
                    }
                  `}
                  >
                    {/* Icon */}
                    <div
                      className={`
                      p-4 rounded-full transition-all duration-300 flex-shrink-0
                      ${
                        isActive
                          ? `bg-cyan-500 text-white`
                          : `bg-cyan-500/20 text-cyan-400`
                      }
                    `}
                    >
                      <Icon size={28} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3
                        className={`
                        text-xl font-bold mb-3 transition-colors duration-300
                        ${
                          isActive
                            ? "text-white"
                            : "text-gray-300"
                        }
                      `}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`
                        transition-colors duration-300 text-base leading-relaxed
                        ${
                          isActive
                            ? "text-gray-200"
                            : "text-gray-400"
                        }
                      `}
                      >
                        {feature.description}
                      </p>
                      <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                        {isActive && (
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side - Image Display */}
          <div className="relative order-2 lg:order-2">
            <motion.div
              key={currentFeature}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
            >
              <Image
                className="rounded-2xl shadow-xl border border-gray-200 w-full h-auto"
                src={features[currentFeature].image}
                alt={features[currentFeature].title}
                width={600}
                height={400}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example usage component
export function GensyFeatures() {
  const features: Feature[] = [
    {
      id: 'lightning-fast',
      title: 'Lightning Fast',
      description: 'Generate high-quality content in seconds with our optimized AI infrastructure and cutting-edge models.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      color: 'yellow'
    },
    {
      id: 'enterprise-security',
      title: 'Enterprise Security',
      description: 'Your data is protected with enterprise-grade security, encryption, and privacy controls you can trust.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      color: 'green'
    },
    {
      id: 'multiple-models',
      title: 'Multiple AI Models',
      description: 'Access 15+ cutting-edge AI models including Flux, Imagen, DALL-E, ByteDance Seeded, and Google Veo.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" /></svg>,
      color: 'purple'
    },
    {
      id: 'easy-export',
      title: 'Easy Export',
      description: 'Download your creations in multiple formats with dynamic naming and organize your creative library.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>,
      color: 'blue'
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      description: 'Work together with your team, share projects, and manage creative workflows seamlessly.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      color: 'indigo'
    },
    {
      id: 'advanced-controls',
      title: 'Advanced Controls',
      description: 'Fine-tune your generations with advanced parameters, styles, and quality settings for perfect results.',
      icon: <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'red'
    }
  ]

  return (
    <Features
      features={features}
      title="Powerful Features for Creative Professionals"
      subtitle="Why Choose Gensy"
      description="Discover the advanced capabilities that make Gensy the ultimate AI creative platform"
      className="bg-gray-50"
    />
  )
}
