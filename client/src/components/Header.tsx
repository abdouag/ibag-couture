"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import SearchBar from "@/components/SearchBar";
import MiniCart from "@/components/MiniCart";

type User = {
  _id: string;
  email: string;
  fullName?: string;
  role: string;
};

const ANNOUNCEMENT_TEXT = "Commandez aujourd\u2019hui et faites-vous livrer sous 48h ouvrables";
const ANNOUNCEMENT_STORAGE_KEY = "ibag-announcement-dismissed";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { totalItems, setIsCartOpen, isHydrated } = useCart();

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    const dismissed = sessionStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (!dismissed) setShowAnnouncement(true);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;

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
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAccountMenuOpen(false);
    window.location.href = "/";
  };

  const dismissAnnouncement = () => {
    setShowAnnouncement(false);
    sessionStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, "1");
  };

  // Ne pas afficher le header client sur les pages admin
  if (isAdmin) {
    return null;
  }

  return (
    <>
      {/* Sticky wrapper — reste colle en haut lors du scroll, compatible iOS */}
      <div className={`sticky top-0 z-50 ${isScrolled ? "shadow-md" : ""}`}>
        {/* Announcement Bar */}
        {showAnnouncement && (
          <div
            role="banner"
            aria-label="Information livraison"
            className="bg-stone-900 text-white"
          >
            <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 flex items-center justify-center relative">
              <p className="text-[11px] sm:text-xs font-light tracking-wide text-center pr-6">
                <span className="mr-1.5 opacity-70" aria-hidden="true">&#10024;</span>
                {ANNOUNCEMENT_TEXT}
                <span className="ml-1.5 opacity-70" aria-hidden="true">&#10024;</span>
              </p>
              <button
                onClick={dismissAnnouncement}
                aria-label="Fermer le bandeau"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-3 h-3 text-white/60 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-stone-200">
          {/* Desktop Nav Row */}
          <div className="hidden lg:block border-b border-stone-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <nav className="flex items-center justify-center gap-8 h-10">
                <Link
                  href="/collections"
                  className="text-[13px] uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Collections
                </Link>
                <Link
                  href="/collections?category=homme"
                  className="text-[13px] uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Homme
                </Link>
                <Link
                  href="/collections?category=femme"
                  className="text-[13px] uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Femme
                </Link>
                <Link
                  href="/contact"
                  className="text-[13px] uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>

          {/* Main header row — 3 columns: left | center logo | right */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center h-20 md:h-24 lg:h-28">
              {/* Left: Burger (mobile) + Search (desktop) */}
              <div className="flex items-center">
                {/* Mobile Burger */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2.5 -ml-2 text-stone-600 hover:text-stone-900 transition-colors"
                  aria-label="Menu"
                >
                  {isMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  )}
                </button>

                {/* Desktop Search */}
                <div className="hidden md:block w-full max-w-sm lg:max-w-md">
                  <SearchBar />
                </div>
              </div>

              {/* Center: Logo - LUXURY SIZE */}
              <div className="flex justify-center">
                <Link href="/" className="flex items-center flex-shrink-0 transition-opacity hover:opacity-80">
                  <img
                    src="/logo.png"
                    alt="Ibag Couture"
                    className="h-14 md:h-20 lg:h-24 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Right: Icons - LUXURY SPACING */}
              <div className="flex items-center justify-end gap-2 sm:gap-3 lg:gap-4">
                {/* Account Icon - LUXURY */}
                <div className="relative" ref={accountMenuRef}>
                  {user ? (
                    <button
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      className="p-2.5 text-stone-500 hover:text-stone-900 transition-all duration-300 relative group"
                      aria-label="Mon compte"
                    >
                      <svg className="w-6 h-6 lg:w-7 lg:h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="p-2.5 text-stone-500 hover:text-stone-900 transition-all duration-300 group"
                      aria-label="Connexion"
                    >
                      <svg className="w-6 h-6 lg:w-7 lg:h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </Link>
                  )}

                  {/* Account Dropdown - LUXURY */}
                  {user && isAccountMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-sm shadow-2xl border border-stone-200 py-3 animate-fadeIn z-50">
                      <div className="px-5 py-4 border-b border-stone-100">
                        <p className="text-sm font-medium text-stone-900 mb-0.5">{user.fullName || "Client"}</p>
                        <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/account"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          Mon compte
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          Mes commandes
                        </Link>
                        <Link
                          href="/account/measures"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                          </svg>
                          Mes mesures
                        </Link>
                      </div>
                      <div className="border-t border-stone-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Icon - LUXURY */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="p-2.5 text-stone-500 hover:text-stone-900 transition-all duration-300 relative group"
                  aria-label="Panier"
                >
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {isHydrated && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center min-w-[20px] h-[20px] shadow-md">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Search Row - LUXURY */}
            <div className="md:hidden pb-3 pt-1">
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
                  <div className="flex gap-2 px-4 py-2">
                    {[
                      { label: "Homme", slug: "homme" },
                      { label: "Femme", slug: "femme" },
                      { label: "Traditionnel", slug: "traditionnel" },
                      { label: "Moderne", slug: "moderne" },
                    ].map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/collections?category=${cat.slug}`}
                        className="px-3 py-1.5 text-xs tracking-wide uppercase bg-stone-100 text-stone-600 hover:bg-stone-900 hover:text-white rounded-full transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/contact"
                    className="px-4 py-3.5 text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors tracking-wide rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
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
      </div>

      {/* MiniCart Drawer */}
      <MiniCart />
    </>
  );
}
