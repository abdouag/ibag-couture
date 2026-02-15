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
          <h2 className="text-lg font-serif text-noir">
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
            <p className="text-noir font-medium mb-2">Votre panier est vide</p>
            <p className="text-stone-500 text-sm mb-6">Decouvrez nos creations et ajoutez vos coups de coeur.</p>
            <Link
              href="/collections"
              onClick={() => setIsCartOpen(false)}
              className="inline-block border border-noir text-noir px-8 py-3 text-sm tracking-wide hover:bg-noir hover:text-white transition-all duration-300 btn-luxury"
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
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
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
                    <p className="text-xs text-brand-gold-dark uppercase tracking-wide">{item.category}</p>
                    <Link
                      href={`/produits/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="text-sm font-medium text-stone-900 hover:text-brand-gold-dark transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    {item.promoPrice != null && item.promoPrice > 0 && item.promoPrice < item.basePrice ? (
                      <p className="text-sm mt-1">
                        <span className="font-medium text-red-700">{item.promoPrice.toLocaleString("fr-FR")} FCFA</span>
                        <span className="ml-1.5 text-stone-400 line-through text-xs">{item.basePrice.toLocaleString("fr-FR")}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-stone-700 font-medium mt-1">
                        {item.basePrice.toLocaleString("fr-FR")} FCFA
                      </p>
                    )}

                    {/* Quantity + Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-stone-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 text-sm text-noir min-w-[24px] text-center">
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
                      className="inline-block mt-2 text-xs text-brand-gold-dark hover:text-amber-800 font-medium transition-colors"
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

              <a
                href={`https://wa.me/221770470928?text=${encodeURIComponent(`Bonjour Ibag Couture, je souhaite commander les articles suivants :\n${items.map((i) => `- ${i.name} (x${i.quantity})`).join("\n")}\nTotal : ${totalPrice.toLocaleString("fr-FR")} FCFA`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-noir text-white py-3.5 text-sm tracking-wide font-medium hover:bg-noir-light transition-colors btn-luxury"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Commander via WhatsApp
              </a>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full border border-stone-300 text-stone-700 py-3 text-sm tracking-wide hover:bg-stone-100 transition-colors mt-2"
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
