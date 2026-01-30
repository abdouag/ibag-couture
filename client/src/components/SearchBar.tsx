"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: string;
  mainImage?: string;
};

type ApiResponse = {
  success: boolean;
  data: Product[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SearchBar({ isMobile = false }: { isMobile?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=5&isActive=true`
        );
        const data: ApiResponse = await res.json();
        if (data.success) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getImageUrl = (img?: string) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${API_URL}${img}`;
  };

  return (
    <div ref={containerRef} className={`relative ${isMobile ? "w-full" : "flex-1 max-w-lg mx-6"}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Qu'est-ce que vous cherchez ?"
          className={`w-full bg-stone-100 border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 transition-colors ${
            isMobile ? "py-2.5 pl-10 pr-4 rounded" : "py-2 pl-10 pr-4 rounded-full"
          }`}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded shadow-lg z-50 overflow-hidden animate-fadeIn">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-stone-500">
              Aucun resultat pour &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <>
              {results.map((product) => (
                <Link
                  key={product._id}
                  href={`/produits/${product.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-14 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                    {getImageUrl(product.mainImage) ? (
                      <img
                        src={getImageUrl(product.mainImage)!}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-400 uppercase tracking-wide">{product.category}</span>
                      <span className="text-xs text-stone-300">|</span>
                      <span className="text-sm text-stone-700 font-medium">
                        {product.basePrice.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}

              {/* View all results */}
              <Link
                href={`/collections?search=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="block px-4 py-3 text-center text-sm text-amber-700 font-medium hover:bg-amber-50 transition-colors border-t border-stone-200"
              >
                Voir tous les resultats
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
