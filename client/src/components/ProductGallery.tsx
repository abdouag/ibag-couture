"use client";

import { useRef, useState } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary";

type ProductGalleryProps = {
  mainImage?: string;
  images?: string[];
  productName: string;
};

/**
 * Galerie produit.
 *
 * Mobile : carrousel plein ecran, balayage au doigt (scroll-snap natif, sans
 * bibliotheque), points de navigation. Desktop : vignettes verticales et
 * fleches. Les photos sont servies redimensionnees par Cloudinary ; la
 * premiere est chargee en priorite, c'est le plus grand element visible de la
 * page et donc son temps d'affichage percu.
 */
export default function ProductGallery({ mainImage, images, productName }: ProductGalleryProps) {
  const allImages = mainImage
    ? [mainImage, ...(images || []).filter((img) => img !== mainImage)]
    : images || [];

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const bounded = (target + allImages.length) % allImages.length;
    track.scrollTo({ left: bounded * track.clientWidth, behavior: "smooth" });
  };

  if (allImages.length === 0) {
    return (
      <div className="aspect-[3/4] lg:aspect-[4/5] bg-[#EFEDEA] flex items-center justify-center text-[#B5AFA8]">
        <span className="text-xs tracking-[0.2em] uppercase">Photo à venir</span>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:gap-4">
      {/* Vignettes desktop */}
      {allImages.length > 1 && (
        <div className="hidden lg:flex lg:flex-col gap-2 w-16 flex-shrink-0">
          {allImages.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1}`}
              className={`aspect-[3/4] overflow-hidden bg-[#EFEDEA] transition-opacity duration-300 ${
                i === index ? "opacity-100 ring-1 ring-[#0D0D0D]" : "opacity-50 hover:opacity-100"
              }`}
            >
              <img
                src={cloudinaryUrl(img, { w: 160 })}
                alt=""
                className="w-full h-full object-cover object-[center_12%]"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 min-w-0">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[3/4] lg:aspect-[4/5] bg-[#EFEDEA]"
        >
          {allImages.map((img, i) => (
            <div key={img + i} className="relative w-full h-full flex-shrink-0 snap-start">
              {/* Les photos studio sont des portraits en pied, le visage pres du
                  bord haut : on ancre le recadrage vers le haut pour ne jamais
                  couper la tete, quitte a perdre un peu de jambe. */}
              <img
                src={cloudinaryUrl(img, { w: 1000 })}
                alt={`${productName} — photo ${i + 1}`}
                className="w-full h-full object-cover object-[center_12%]"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {allImages.length > 1 && (
          <>
            {/* Fleches desktop */}
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Photo précédente"
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/90 hover:bg-white text-[#0D0D0D] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Photo suivante"
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center bg-white/90 hover:bg-white text-[#0D0D0D] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Points mobile */}
            <div className="lg:hidden absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-[11px] tracking-wider tabular-nums">
              {index + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
