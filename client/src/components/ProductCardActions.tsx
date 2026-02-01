"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

type Props = {
  product: {
    productId: string;
    slug: string;
    name: string;
    category: string;
    basePrice: number;
    promoPrice?: number | null;
    mainImage?: string;
  };
  isOutOfStock?: boolean;
};

export default function ProductCardActions({ product, isOutOfStock }: Props) {
  const { addItem, setIsCartOpen } = useCart();
  const [added, setAdded] = useState(false);

  if (isOutOfStock) return null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className={`w-full mt-2 sm:mt-3 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-[11px] sm:text-xs tracking-wide uppercase font-medium transition-all duration-300 ${
        added
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-stone-900 text-white hover:bg-stone-800"
      }`}
    >
      {added ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="hidden sm:inline">Ajout&eacute;</span>
          <span className="sm:hidden">OK</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="hidden sm:inline">Ajouter au panier</span>
          <span className="sm:hidden">Panier</span>
        </>
      )}
    </button>
  );
}
