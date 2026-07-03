"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  promoPrice?: number;
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
          className={`w-full bg-[#F5F5F5] border border-[#E8E4E0] text-[#0D0D0D] text-sm placeholder:text-[#999] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]/20 transition-colors ${
            isMobile ? "py-2.5 pl-10 pr-4 rounded" : "py-2 pl-10 pr-4 rounded-full"
          }`}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]"
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
            <div className="w-4 h-4 border-2 border-[#E8E4E0] border-t-[#C9A45C] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E4E0] rounded shadow-lg z-50 overflow-hidden animate-fadeIn">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[#999]">
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
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors border-b border-[#E8E4E0] last:border-b-0"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 bg-[#E8E4E0] rounded overflow-hidden flex-shrink-0">
                    {getImageUrl(product.mainImage) ? (
                      <img
                        src={getImageUrl(product.mainImage)!}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#C8C0B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0D0D0D] truncate">{product.name}</p>
                    <p className="text-xs text-[#C9A45C] mt-0.5">
                      {(product.promoPrice || product.basePrice)?.toLocaleString("fr-FR")} F
                    </p>
                  </div>

                  <svg className="w-4 h-4 text-[#C8C0B8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="block px-4 py-3 text-center text-sm text-[#C9A45C] font-medium hover:bg-[#F5F5F5] transition-colors border-t border-[#E8E4E0]"
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
