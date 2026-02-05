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

  const activeCategory = category || "tous";
  const products = activeCategory === "tous"
    ? allProducts
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
    <main className="min-h-screen bg-stone-50">
      {/* Hero Introduction */}
      <section className="pt-8 md:pt-10 pb-10 md:pb-14 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Accueil
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-stone-900 font-medium">Collections</span>
          </nav>

          {/* Title & Description */}
          <div className="max-w-3xl">
            <p className="text-amber-700 text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              Haute Couture Africaine
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 mb-6 leading-tight">
              Nos Collections
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed">
              Explorez notre sélection de créations sur mesure, alliant traditions africaines
              et élégance contemporaine. Chaque pièce est confectionnée avec soin selon vos mesures.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-5 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <Suspense fallback={
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <div key={cat} className="px-6 py-2 bg-stone-100 rounded animate-pulse h-9 w-24" />
              ))}
            </div>
          }>
            <CategoryFilter categories={categories} productCounts={productCounts} />
          </Suspense>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 border border-stone-300 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-serif text-stone-900 mb-2">
                {activeCategory !== "tous"
                  ? `Aucune création dans la catégorie "${activeCategory}"`
                  : "Aucune création disponible"}
              </h2>
              <p className="text-stone-500 mb-8">
                {activeCategory !== "tous"
                  ? "Essayez une autre catégorie ou consultez toutes nos créations."
                  : "Nos nouvelles collections arrivent bientôt."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {activeCategory !== "tous" ? (
                  <Link
                    href="/collections"
                    className="inline-block border border-stone-900 text-stone-900 px-8 py-3 text-sm tracking-wide hover:bg-stone-900 hover:text-white transition-all duration-300"
                  >
                    Voir toutes les créations
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-block border border-stone-900 text-stone-900 px-8 py-3 text-sm tracking-wide hover:bg-stone-900 hover:text-white transition-all duration-300"
                  >
                    Retour à l&apos;accueil
                  </Link>
                )}
                <Link
                  href="/#contact"
                  className="inline-block bg-amber-700 text-white px-8 py-3 text-sm tracking-wide hover:bg-amber-800 transition-all duration-300"
                >
                  Nous contacter pour une création personnalisée
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-500 mb-6">
                {products.length} création{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
                {activeCategory !== "tous" && (
                  <span> dans <span className="font-medium text-stone-700">{activeCategory}</span></span>
                )}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="group hover:-translate-y-1 transition-transform duration-300"
                  >
                    {/* Image */}
                    <Link href={`/produits/${product.slug || product._id}`}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden mb-2 sm:mb-4">
                        {(product.mainImage || (product.images && product.images.length > 0)) ? (
                          <img
                            src={(() => {
                              const imgUrl = product.mainImage || product.images![0];
                              if (imgUrl.startsWith("http")) return imgUrl;
                              return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${imgUrl}`;
                            })()}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-400 group-hover:scale-110 transition-transform duration-700">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Category Badge */}
                        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1">
                          <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-[10px] sm:text-xs tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1">
                            {product.category}
                          </span>
                          {product.promoPrice != null && product.promoPrice < product.basePrice && (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1">
                              -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Stock badge */}
                        {product.hasStock === true && product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-stock-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                              </span>
                              {product.stockQuantity} restant{product.stockQuantity > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {/* Out of stock overlay */}
                        {product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0) && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="bg-stone-900/80 text-white text-xs sm:text-sm px-4 py-1.5 tracking-wide uppercase">
                              Rupture de stock
                            </span>
                          </div>
                        )}

                        {/* Quick View Overlay */}
                        {!(product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0)) && (
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-500 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-6 py-2 text-sm tracking-wide">
                              Voir le modèle
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div>
                      <Link href={`/produits/${product.slug || product._id}`}>
                        <h2 className="font-serif text-sm sm:text-lg text-stone-900 mb-0.5 sm:mb-1 group-hover:text-amber-700 transition-colors line-clamp-1 sm:line-clamp-none">
                          {product.name}
                        </h2>
                      </Link>

                      <div className="flex items-center justify-between">
                        {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                          <p className="text-xs sm:text-base">
                            <span className="font-medium text-red-700">{product.promoPrice.toLocaleString('fr-FR')}</span>
                            <span className="text-xs sm:text-sm text-stone-500"> FCFA</span>
                            <span className="ml-1.5 text-stone-400 line-through text-[10px] sm:text-sm">{product.basePrice.toLocaleString('fr-FR')}</span>
                          </p>
                        ) : (
                          <p className="text-stone-900 text-xs sm:text-base">
                            <span className="hidden sm:inline text-sm text-stone-500">À partir de </span>
                            <span className="font-medium">{product.basePrice.toLocaleString('fr-FR')}</span>
                            <span className="text-xs sm:text-sm text-stone-500"> FCFA</span>
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

      {/* CTA Section */}
      <section className="py-14 md:py-16 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-3">
            Vous ne trouvez pas ce que vous cherchez ?
          </h2>
          <p className="text-stone-400 mb-6 leading-relaxed">
            Nos artisans peuvent créer une pièce unique selon vos envies.
            Contactez-nous pour une création personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20une%20cr%C3%A9ation%20personnalis%C3%A9e."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#25D366] hover:text-white transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-block border border-white text-white px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-white hover:text-stone-900 transition-all duration-300"
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
