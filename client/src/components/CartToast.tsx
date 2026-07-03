"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

export default function CartToast() {
  const { lastAddedItem, setIsCartOpen } = useCart();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (lastAddedItem) {
      setLeaving(false);
      setVisible(true);
      const timer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem]);

  if (!visible || !lastAddedItem) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const imgSrc = lastAddedItem.mainImage?.startsWith("http")
    ? lastAddedItem.mainImage
    : `${API_URL}${lastAddedItem.mainImage}`;

  return (
    <div
      className={`fixed top-20 right-4 md:right-6 z-[100] max-w-sm w-full ${
        leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-[#E8E4E0] p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded bg-[#E8E4E0] overflow-hidden flex-shrink-0">
          {lastAddedItem.mainImage && (
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#C9A45C] uppercase tracking-[0.15em] mb-0.5">
            Ajouté au panier
          </p>
          <p className="text-sm text-[#0D0D0D] font-medium truncate">
            {lastAddedItem.name}
          </p>
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-xs text-[#C9A45C] hover:text-[#A67C3D] mt-1 transition-colors"
          >
            Voir le panier →
          </button>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-[#999] hover:text-[#0D0D0D] transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
