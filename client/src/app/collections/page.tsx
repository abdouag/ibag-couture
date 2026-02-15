import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCardActions from "@/components/ProductCardActions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  try {
    const res = await fetch(`${API_URL}/api/products?limit=200`, { cache: "no-store" });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      allProducts = data?.data || [];
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

  const activeCategory = category || "tous";
  const products = activeCategory === "tous"
    ? diversify(allProducts)
    : allProducts.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  const categories = ["tous", "homme", "femme", "traditionnel", "moderne"];

  // Count products per category
  const productCounts: Record<string, number> = {};
  for (const cat of categories) {
    productCounts[cat] = cat === "tous"
      ? allProducts.length
      : allProducts.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
  }

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero Introduction - LUXURY */}
      <section className="pt-12 md:pt-16 lg:pt-20 pb-12 md:pb-16 lg:pb-20 bg-white relative grain-texture">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          {/* Breadcrumb - LUXURY */}
          <nav className="flex items-center gap-2 text-sm md:text-base text-stone-400 mb-10 md:mb-12">
            <Link href="/" className="hover:text-stone-900 transition-colors duration-300">
              Accueil
            </Link>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-noir font-medium">Collections</span>
          </nav>

          {/* Title & Description - LUXURY */}
          <div className="max-w-4xl">
            <p className="text-brand-gold-dark text-xs md:text-sm tracking-[0.35em] uppercase mb-4 md:mb-6 font-light">
              Haute Couture Africaine
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-luxury text-noir mb-6 md:mb-8 leading-tight">
              Nos Collections
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-stone-600 leading-relaxed">
              Explorez notre sélection de créations sur mesure, alliant traditions africaines
              et élégance contemporaine. Chaque pièce est confectionnée avec soin selon vos mesures.
            </p>
          </div>
        </div>
      </section>

      {/* Filters - LUXURY */}
      <section className="py-6 md:py-8 bg-white border-b border-stone-200 shadow-[0_1px_0_rgba(197,165,114,0.15)] sticky top-20 md:top-24 lg:top-28 z-40 backdrop-blur-lg bg-white/95">
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
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 border-2 border-brand-gold/30 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 md:w-14 md:h-14 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-luxury text-stone-900 mb-3">
                {activeCategory !== "tous"
                  ? `Aucune création dans la catégorie "${activeCategory}"`
                  : "Aucune création disponible"}
              </h2>
              <p className="text-base md:text-lg text-stone-500 mb-10 md:mb-12">
                {activeCategory !== "tous"
                  ? "Essayez une autre catégorie ou consultez toutes nos créations."
                  : "Nos nouvelles collections arrivent bientôt."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
                {activeCategory !== "tous" ? (
                  <Link
                    href="/collections"
                    className="inline-block border-2 border-stone-900 text-stone-900 px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-500 font-medium hover:scale-105"
                  >
                    Voir toutes les créations
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-block border-2 border-stone-900 text-stone-900 px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-500 font-medium hover:scale-105"
                  >
                    Retour à l&apos;accueil
                  </Link>
                )}
                <Link
                  href="/contact"
                  className="inline-block bg-brand-gold-dark text-white px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-amber-800 hover:shadow-2xl transition-all duration-500 font-medium hover:scale-105"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm md:text-base text-stone-500 mb-8 md:mb-10">
                {products.length} création{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
                {activeCategory !== "tous" && (
                  <span> dans <span className="font-medium text-stone-700 font-luxury">{activeCategory}</span></span>
                )}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 sr-stagger">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="group hover-tilt sr-hidden sr-from-up"
                  >
                    {/* Image - LUXURY */}
                    <Link href={`/produits/${product.slug || product._id}`}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden mb-3 sm:mb-5 rounded-sm">
                        {(product.mainImage || (product.images && product.images.length > 0)) ? (
                          <img
                            src={(() => {
                              const imgUrl = product.mainImage || product.images![0];
                              if (imgUrl.startsWith("http")) return imgUrl;
                              return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${imgUrl}`;
                            })()}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-400 group-hover:scale-110 transition-transform duration-700 ease-out">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Category Badge - LUXURY */}
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5">
                          <span
                            className="backdrop-blur-sm font-medium text-[10px] sm:text-xs tracking-[0.15em] uppercase px-2.5 py-1 sm:px-3 sm:py-1.5"
                            style={{backgroundColor: product.category.toLowerCase() === 'femme' ? '#FDF2F8' : product.category.toLowerCase() === 'homme' ? '#F5F5F4' : product.category.toLowerCase() === 'traditionnel' ? '#FFFBEB' : '#F8FAFC', color: product.category.toLowerCase() === 'femme' ? '#9D174D' : product.category.toLowerCase() === 'homme' ? '#78716C' : product.category.toLowerCase() === 'traditionnel' ? '#92400E' : '#475569'}}
                          >
                            {product.category}
                          </span>
                          {product.promoPrice != null && product.promoPrice < product.basePrice && (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1">
                              -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Stock badge - LUXURY */}
                        {product.hasStock === true && product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/95 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-stock-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                              </span>
                              {product.stockQuantity} restant{product.stockQuantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {/* Out of stock overlay - LUXURY */}
                        {product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0) && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-stone-900/90 text-white text-xs sm:text-sm px-5 py-2 tracking-[0.15em] uppercase font-light">
                              Rupture de stock
                            </span>
                          </div>
                        )}

                        {/* Quick View Overlay - LUXURY */}
                        {!(product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0)) && (
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-all duration-700 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-7 py-3 text-xs sm:text-sm tracking-[0.2em] uppercase font-light shadow-lg">
                              Voir le modèle
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info - LUXURY */}
                    <div className="px-1">
                      <Link href={`/produits/${product.slug || product._id}`}>
                        <h2 className="font-luxury text-base sm:text-lg lg:text-xl text-stone-900 mb-1 sm:mb-2 group-hover:text-stone-600 transition-colors duration-300 line-clamp-1 sm:line-clamp-2">
                          {product.name}
                        </h2>
                      </Link>

                      <div className="flex items-baseline justify-between mb-3">
                        {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                          <div className="flex flex-col">
                            <p className="text-sm sm:text-base lg:text-lg">
                              <span className="font-medium text-red-700">{product.promoPrice.toLocaleString('fr-FR')}</span>
                              <span className="text-xs text-stone-500 ml-1">FCFA</span>
                            </p>
                            <span className="text-stone-400 line-through text-xs sm:text-sm">{product.basePrice.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        ) : (
                          <p className="text-stone-900 text-sm sm:text-base lg:text-lg">
                            <span className="font-medium font-luxury">{product.basePrice.toLocaleString('fr-FR')}</span>
                            <span className="text-xs sm:text-sm text-stone-500 ml-1">FCFA</span>
                          </p>
                        )}
                      </div>

                      <ProductCardActions
                        product={{
                          productId: product._id,
                          slug: product.slug,
                          name: product.name,
                          category: product.category,
                          basePrice: product.basePrice,
                          promoPrice: product.promoPrice,
                          mainImage: product.mainImage,
                        }}
                        isOutOfStock={product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section - LUXURY */}
      <section className="py-16 md:py-20 lg:py-24 gradient-brand pattern-geo relative text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-luxury mb-4 md:mb-6 leading-tight">
            Vous ne trouvez pas ce que vous cherchez ?
          </h2>
          <p className="text-stone-300 text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto">
            Nos artisans peuvent créer une pièce unique selon vos envies.
            Contactez-nous pour une création personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20une%20cr%C3%A9ation%20personnalis%C3%A9e."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury inline-flex items-center justify-center gap-3 border-2 border-[#25D366] text-[#25D366] px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase font-medium hover:bg-[#25D366] hover:text-white transition-all duration-500 hover:scale-105"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <Link
              href="/contact"
              className="btn-luxury inline-block border-2 border-white text-white px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-stone-900 transition-all duration-500 hover:scale-105"
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
