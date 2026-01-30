"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ProductGalleryProps = {
  mainImage?: string;
  images?: string[];
  category: string;
  productName: string;
};

export default function ProductGallery({ mainImage, images, category, productName }: ProductGalleryProps) {
  const allImages = mainImage
    ? [mainImage, ...(images || []).filter((img) => img !== mainImage)]
    : images || [];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasImages = allImages.length > 0;

  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_URL}${url}`;
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
    const parent = e.currentTarget.parentElement;
    if (parent && !parent.querySelector(".img-fallback")) {
      const fallback = document.createElement("div");
      fallback.className = "img-fallback absolute inset-0 flex items-center justify-center bg-stone-100";
      fallback.innerHTML = `<svg class="w-16 h-16 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
      parent.appendChild(fallback);
    }
  };

  if (!hasImages) {
    return (
      <div className="space-y-4">
        <div className="aspect-[4/5] bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 relative overflow-hidden rounded-sm shadow-sm">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
            <svg className="w-20 h-20 md:w-28 md:h-28 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-stone-400 tracking-wide">Photo bientot disponible</p>
          </div>
          <div className="absolute top-4 left-4 md:top-6 md:left-6">
            <span className="bg-stone-900 text-white text-[10px] md:text-xs tracking-[0.2em] uppercase px-3 py-1.5 md:px-4 md:py-2 font-medium">
              {category}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-[4/5] bg-white relative overflow-hidden rounded-sm shadow-sm">
        <img
          src={getFullUrl(allImages[selectedIndex])}
          alt={`${productName} - Photo ${selectedIndex + 1}`}
          className="w-full h-full object-contain"
          onError={handleImgError}
        />

        {/* Category Badge */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <span className="bg-stone-900 text-white text-[10px] md:text-xs tracking-[0.2em] uppercase px-3 py-1.5 md:px-4 md:py-2 font-medium">
            {category}
          </span>
        </div>

        {/* Navigation arrows for multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-stone-700 font-medium shadow-sm">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {allImages.slice(0, 4).map((img, index) => (
            <button
              key={img + index}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square bg-stone-100 relative overflow-hidden rounded-sm cursor-pointer transition-all duration-300 ${
                index === selectedIndex
                  ? "ring-2 ring-stone-900 ring-offset-2"
                  : "hover:ring-1 hover:ring-stone-300 hover:ring-offset-1"
              }`}
            >
              <img
                src={getFullUrl(img)}
                alt={`${productName} - Miniature ${index + 1}`}
                className="w-full h-full object-cover"
                onError={handleImgError}
              />
            </button>
          ))}
          {allImages.length > 4 && (
            <button
              onClick={() => setSelectedIndex(4)}
              className="aspect-square bg-stone-200 relative overflow-hidden rounded-sm cursor-pointer flex items-center justify-center text-stone-600 font-medium hover:bg-stone-300 transition-colors"
            >
              +{allImages.length - 4}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
