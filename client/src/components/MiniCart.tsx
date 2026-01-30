"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getImageUrl(img?: string) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_URL}${img}`;
}

export default function MiniCart() {
  const { items, removeItem, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fadeInBackdrop"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-serif text-stone-900">
            Votre Panier
            {items.length > 0 && (
              <span className="text-sm font-sans text-stone-400 ml-2">
                ({items.reduce((sum, i) => sum + i.quantity, 0)} article{items.reduce((sum, i) => sum + i.quantity, 0) > 1 ? "s" : ""})
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 border border-stone-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="text-stone-900 font-medium mb-2">Votre panier est vide</p>
            <p className="text-stone-500 text-sm mb-6">Decouvrez nos creations et ajoutez vos coups de coeur.</p>
            <Link
              href="/collections"
              onClick={() => setIsCartOpen(false)}
              className="inline-block border border-stone-900 text-stone-900 px-8 py-3 text-sm tracking-wide hover:bg-stone-900 hover:text-white transition-all duration-300"
            >
              Voir les collections
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 px-6 py-4 border-b border-stone-100">
                  {/* Image */}
                  <div className="w-20 h-24 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                    {getImageUrl(item.mainImage) ? (
                      <img
                        src={getImageUrl(item.mainImage)!}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-700 uppercase tracking-wide">{item.category}</p>
                    <Link
                      href={`/produits/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="text-sm font-medium text-stone-900 hover:text-amber-700 transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-stone-700 font-medium mt-1">
                      {item.basePrice.toLocaleString("fr-FR")} FCFA
                    </p>

                    {/* Quantity + Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-stone-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-sm text-stone-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-stone-400 hover:text-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>

                    {/* Per-item order link */}
                    <Link
                      href={`/commander/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="inline-block mt-2 text-xs text-amber-700 hover:text-amber-800 font-medium transition-colors"
                    >
                      Commander ce modele &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 px-6 py-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-stone-600">Sous-total</span>
                <span className="text-lg font-medium text-stone-900">
                  {totalPrice.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">Prix de base, hors options et sur-mesure</p>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full border border-stone-300 text-stone-700 py-3 text-sm tracking-wide hover:bg-stone-100 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
