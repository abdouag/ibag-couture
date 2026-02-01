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
  variant?: "default" | "icon";
};

export default function AddToCartButton({ product, variant = "default" }: Props) {
  const { addItem, setIsCartOpen } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleAdd}
        className={`flex items-center justify-center w-10 h-10 border rounded transition-all duration-300 ${
          added
            ? "border-green-500 bg-green-50 text-green-700"
            : "border-stone-300 text-stone-700 hover:bg-stone-100"
        }`}
        aria-label="Ajouter au panier"
      >
        {added ? (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-2 border py-4 text-sm tracking-wide transition-all duration-300 ${
        added
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-stone-300 text-stone-700 hover:bg-stone-100"
      }`}
    >
      {added ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Ajoute au panier
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Ajouter au panier
        </>
      )}
    </button>
  );
}
