 "use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";

type HeroImage = {
  url: string;
  alt: string;
};

type Props = {
  images: HeroImage[];
  fallbackImage?: string;
  interval?: number; // ms between transitions
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * HeroDynamicGallery - Premium hero slideshow component
 * Features: fade transitions, Ken Burns zoom effect, dark overlay for text readability
 */
export default function HeroDynamicGallery({
  images,
  fallbackImage = "/images/IMG_1991.PNG",
  interval = 6000,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));

  // Shuffle images once on mount for random display
  const shuffledImages = useMemo(() => {
    if (images.length === 0) return [];
    const shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [images]);

  // Get full URL for image
  const getImageUrl = useCallback((url: string) => {
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  }, []);

  // Preload next image
  const preloadImage = useCallback(
    (index: number) => {
      if (shuffledImages.length === 0) return;
      const nextIndex = (index + 1) % shuffledImages.length;
      if (!imagesLoaded.has(nextIndex)) {
        const img = new window.Image();
        img.src = getImageUrl(shuffledImages[nextIndex].url);
        img.onload = () => {
          setImagesLoaded((prev) => new Set([...prev, nextIndex]));
        };
      }
    },
    [shuffledImages, imagesLoaded, getImageUrl]
  );

  // Auto-advance slideshow
  useEffect(() => {
    if (shuffledImages.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % shuffledImages.length);
        setIsTransitioning(false);
      }, 1000); // Fade duration
    }, interval);

    return () => clearInterval(timer);
  }, [shuffledImages.length, interval]);

  // Preload next image when current changes
  useEffect(() => {
    preloadImage(currentIndex);
  }, [currentIndex, preloadImage]);

  // If no product images, show fallback
  if (shuffledImages.length === 0) {
    return (
      <div className="absolute inset-0">
        <Image
          src={fallbackImage}
          alt="Ibag Couture — Haute couture africaine"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Premium dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>
    );
  }

  const currentImage = shuffledImages[currentIndex];
  const nextIndex = (currentIndex + 1) % shuffledImages.length;
  const nextImage = shuffledImages[nextIndex];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Current image with Ken Burns zoom effect */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 animate-hero-zoom">
          <img
            src={getImageUrl(currentImage.url)}
            alt={currentImage.alt}
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: "center 15%" }}
          />
        </div>
      </div>

      {/* Next image (preloaded, shown during transition) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 animate-hero-zoom">
          <img
            src={getImageUrl(nextImage.url)}
            alt={nextImage.alt}
            className="w-full h-full object-cover object-top"
            style={{ objectPosition: "center 15%" }}
          />
        </div>
      </div>

      {/* Premium dark gradient overlay for text readability */}
      {/* Horizontal gradient: darker on left for text */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/35" />
      {/* Vertical gradient: subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25" />
      {/* Extra bottom fade for premium look */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

      {/* Subtle slide indicators */}
      {shuffledImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {shuffledImages.slice(0, Math.min(5, shuffledImages.length)).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx !== currentIndex) {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(idx);
                    setIsTransitioning(false);
                  }, 1000);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Voir image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
