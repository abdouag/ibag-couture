"use client";

import { useState } from "react";

export default function ProductDescription({ description }: { description: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-stone-200 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 md:px-6 md:py-5 bg-white hover:bg-stone-50 transition-colors duration-200"
      >
        <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-stone-900 font-medium">
          Details du produit
        </h2>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 md:px-6 md:pb-6 border-t border-stone-100">
            <p className="text-stone-600 leading-relaxed text-base md:text-lg pt-4">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
