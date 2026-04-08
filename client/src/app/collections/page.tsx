import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import CategoryFilter from "@/components/CategoryFilter";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getFullImageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: string;
  description?: string;
  mainImage?: string;
  images?: string[];
  productionTime?: number;
  hasStock?: boolean;
  stockQuantity?: number | null;
  promoPrice?: number | null;
};

type ApiResponse = {
  success: boolean;
  data: Product[];
  total: number;
};

export const metadata = {
  title: "Collections — Haute Couture Africaine",
  description:
    "Explorez nos collections de haute couture africaine sur mesure : robes, costumes, tenues traditionnelles et modernes. Confection artisanale selon vos mesures.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Collections | Ibag Couture",
    description:
      "Robes, costumes et créations sur mesure alliant traditions africaines et élégance contemporaine. Parcourez nos collections homme, femme, traditionnel et moderne.",
    url: "/collections",
  },
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function CollectionsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  let allProducts: Product[] = [];
  let total = 0;
  try {
    const res = await fetch(`${API_URL}/api/products?limit=200`, { cache: "no-store" });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      allProducts = data?.data || [];
      total = data?.total ?? allProducts.length;
    }
  } catch {
    // API not available
  }

  // Diversifier l'affichage : alterner les catégories pour un mélange visuel
  const diversify = (items: Product[]): Product[] => {
    if (items.length <= 1) return items;
    const result: Product[] = [];
    const remaining = [...items];
    const catCount: Record<string, number> = {};

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestCatCount = Infinity;
      const lookAhead = Math.min(remaining.length, 8);
      for (let i = 0; i < lookAhead; i++) {
        const cc = catCount[remaining[i].category?.toLowerCase() || ""] || 0;
        if (cc < bestCatCount) {
          bestCatCount = cc;
          bestIdx = i;
        }
      }
      const picked = remaining.splice(bestIdx, 1)[0];
      const cat = picked.category?.toLowerCase() || "";
      catCount[cat] = (catCount[cat] || 0) + 1;
      result.push(picked);
    }
    return result;
  };

  // Sort: in-stock products first, out-of-stock at the end
  const sortByStock = (items: Product[]): Product[] => {
    const inStock = items.filter((p) => p.hasStock !== false && p.hasStock !== null);
    const outOfStock = items.filter((p) => p.hasStock === false || p.hasStock === null);
    return [...inStock, ...outOfStock];
  };

  const activeCategory = category || "tous";
  const filtered = activeCategory === "tous"
    ? diversify(allProducts)
    : allProducts.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
  const products = sortByStock(filtered);

  const categories = ["tous", "homme", "femme", "traditionnel", "moderne"];

  // Count products per category
  const productCounts: Record<string, number> = {};
  for (const cat of categories) {
    productCounts[cat] = cat === "tous"
      ? allProducts.length
      : allProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero Introduction - LUXURY */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-10 md:pt-16 pb-6 md:pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#999] mb-8">
            <Link href="/" className="hover:text-[#C9A45C] transition-colors duration-300">
              Accueil
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-[#0D0D0D] font-medium">Collections</span>
          </nav>

          {/* Centered luxury header */}
          <div className="text-center">
            <p className="label-gold mb-3">IBAG COUTURE</p>
            <h1 className="font-luxury text-3xl md:text-4xl lg:text-5xl text-[#0D0D0D] mb-2">Nos Collections</h1>
            <p className="text-[#999] text-sm">{total} création{total > 1 ? "s" : ""}</p>
          </div>
        </div>
      </section>

      {/* Filters - LUXURY */}
      <section className="py-6 md:py-8 bg-white border-b border-black/[0.06] shadow-sm sticky top-16 md:top-20 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Suspense fallback={
            <div className="flex items-center gap-3">
              {categories.map((cat) => (
                <div key={cat} className="px-8 py-3 bg-stone-100 rounded-full animate-pulse h-11 w-28" />
              ))}
            </div>
          }>
            <CategoryFilter categories={categories} productCounts={productCounts} />
          </Suspense>
        </div>
      </section>

      {/* Products Grid - LUXURY */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {products.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 border-2 border-[#E8E4E0] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 md:w-14 md:h-14 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-luxury text-stone-900 mb-3">
                {activeCategory !== "tous"
                  ? `Aucune création dans la catégorie "${activeCategory}"`
                  : "Aucune création disponible"}
              </h2>
              <p className="text-base md:text-lg text-[#999] mb-10 md:mb-12">
                {activeCategory !== "tous"
                  ? "Essayez une autre catégorie ou consultez toutes nos créations."
                  : "Nos nouvelles collections arrivent bientôt."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
                {activeCategory !== "tous" ? (
                  <Link
                    href="/collections"
                    className="inline-block border-2 border-[#0D0D0D] text-[#0D0D0D] px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-[#0D0D0D] hover:text-white transition-all duration-500 font-medium hover:scale-105"
                  >
                    Voir toutes les créations
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-block border-2 border-[#0D0D0D] text-[#0D0D0D] px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-[#0D0D0D] hover:text-white transition-all duration-500 font-medium hover:scale-105"
                  >
                    Retour à l&apos;accueil
                  </Link>
                )}
                <Link
                  href="/contact"
                  className="inline-block bg-[#0D0D0D] text-white px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:opacity-80 hover:shadow-2xl transition-all duration-500 font-medium hover:scale-105"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                {products.map((product) => (
                  <Link href={`/produits/${product.slug}`} key={product._id} className="group">
                    <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-[#E8E4E0] mb-3">
                      {product.mainImage && (
                        <img
                          src={getFullImageUrl(product.mainImage)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      {product.images?.[0] && (
                        <img
                          src={getFullImageUrl(product.images[0])}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        {product.promoPrice && product.promoPrice < product.basePrice && (
                          <span className="bg-[#C9A45C] text-white text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
                            -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                          </span>
                        )}
                        {product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity < 3 && (
                          <span className="bg-[#D97706] text-white text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
                            Dernières pièces
                          </span>
                        )}
                      </div>
                      {product.hasStock === false && product.stockQuantity === 0 && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-[#0D0D0D] text-white text-xs px-4 py-2 tracking-wider uppercase">
                            Rupture de stock
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[#C9A45C] text-[9px] uppercase tracking-[0.15em] mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-luxury text-sm md:text-[15px] text-[#0D0D0D] truncate mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[#0D0D0D]">
                        {(product.promoPrice && product.promoPrice < product.basePrice ? product.promoPrice : product.basePrice).toLocaleString("fr-FR")} F
                      </span>
                      {product.promoPrice && product.promoPrice < product.basePrice && (
                        <span className="text-xs text-[#999] line-through">
                          {product.basePrice.toLocaleString("fr-FR")} F
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section - LUXURY */}
      <section className="py-16 md:py-20 lg:py-24 bg-[#0D0D0D] text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="w-16 h-px bg-[#C9A45C] mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-luxury mb-4 md:mb-6 leading-tight">
            Vous ne trouvez pas ce que vous cherchez ?
          </h2>
          <p className="text-[#C9A45C] text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto">
            Nos artisans peuvent créer une pièce unique selon vos envies.
            Contactez-nous pour une création personnalisée.
          </p>
          <div className="w-16 h-px bg-[#C9A45C] mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20une%20cr%C3%A9ation%20personnalis%C3%A9e."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border-2 border-[#25D366] text-[#25D366] px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase font-medium hover:bg-[#25D366] hover:text-white transition-all duration-500 hover:scale-105"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <Link
              href="/contact"
              className="btn-luxury-gold"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
