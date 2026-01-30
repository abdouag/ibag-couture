"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import SearchBar from "@/components/SearchBar";
import MiniCart from "@/components/MiniCart";

type User = {
  _id: string;
  email: string;
  fullName?: string;
  role: string;
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { totalItems, setIsCartOpen, isHydrated } = useCart();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAccountMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200 transition-shadow duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        {/* Main header row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Left: Burger (mobile) + Logo */}
            <div className="flex items-center gap-2">
              {/* Mobile Burger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 -ml-2 text-stone-700 hover:text-stone-900 transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Ibag Couture"
                  className="h-10 md:h-14 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Center: Search (desktop only) */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            {/* Right: Nav (desktop) + Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-6 mr-4">
                <Link
                  href="/collections"
                  className="text-sm tracking-wide text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Collections
                </Link>
                <a
                  href="/#apropos"
                  className="text-sm tracking-wide text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Notre Maison
                </a>
                <a
                  href="/#contact"
                  className="text-sm tracking-wide text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Contact
                </a>
              </nav>

              {/* Account Icon */}
              <div className="relative" ref={accountMenuRef}>
                {user ? (
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="p-2 text-stone-600 hover:text-stone-900 transition-colors relative"
                    aria-label="Mon compte"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="p-2 text-stone-600 hover:text-stone-900 transition-colors"
                    aria-label="Connexion"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </Link>
                )}

                {/* Account Dropdown */}
                {user && isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-sm shadow-lg border border-stone-200 py-2 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">{user.fullName || "Client"}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Mon compte
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Mes commandes
                      </Link>
                      <Link
                        href="/account/measures"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                        </svg>
                        Mes mesures
                      </Link>
                    </div>
                    <div className="border-t border-stone-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Deconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-stone-600 hover:text-stone-900 transition-colors relative"
                aria-label="Panier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {isHydrated && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-amber-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Row */}
          <div className="md:hidden pb-3">
            <SearchBar isMobile />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-stone-200 py-6 animate-fadeIn bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <nav className="flex flex-col gap-1">
                <Link
                  href="/collections"
                  className="px-4 py-3.5 text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors tracking-wide rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Collections
                </Link>
                <a
                  href="/#apropos"
                  className="px-4 py-3.5 text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors tracking-wide rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notre Maison
                </a>
                <a
                  href="/#contact"
                  className="px-4 py-3.5 text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors tracking-wide rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
              </nav>

              {/* Mobile Auth / Account */}
              <div className="mt-4 pt-4 border-t border-stone-200">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-4 py-4 bg-stone-50 rounded mx-1">
                      <p className="text-sm font-medium text-stone-900">{user.fullName || "Client"}</p>
                      <p className="text-xs text-stone-500">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Mon compte
                    </Link>
                    <Link
                      href="/account/orders"
                      className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      Mes commandes
                    </Link>
                    <Link
                      href="/account/measures"
                      className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                      </svg>
                      Mes mesures
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      Deconnexion
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-2">
                    <Link
                      href="/login"
                      className="block text-center py-3 border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      className="block text-center py-3 bg-stone-900 text-white hover:bg-stone-800 transition-colors rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Creer un compte
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MiniCart Drawer */}
      <MiniCart />
    </>
  );
}
