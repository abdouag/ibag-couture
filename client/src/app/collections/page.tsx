import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import CategoryFilter from "@/components/CategoryFilter";

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
    const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
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
      <section className="pt-20 md:pt-24 pb-10 md:pb-14 bg-white border-b border-stone-200">
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
      <section className="py-5 bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-[56px] md:top-[64px] z-40">
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
                        <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                          <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-[10px] sm:text-xs tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1">
                            {product.category}
                          </span>
                        </div>

                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-500 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-6 py-2 text-sm tracking-wide">
                            Voir le modèle
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Info */}
                    <div>
                      <Link href={`/produits/${product.slug || product._id}`}>
                        <h2 className="font-serif text-sm sm:text-lg text-stone-900 mb-0.5 sm:mb-1 group-hover:text-amber-700 transition-colors line-clamp-1 sm:line-clamp-none">
                          {product.name}
                        </h2>
                      </Link>

                      {product.description && (
                        <p className="text-stone-500 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 hidden sm:block">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-stone-900 text-xs sm:text-base">
                          <span className="hidden sm:inline text-sm text-stone-500">À partir de </span>
                          <span className="font-medium">{product.basePrice.toLocaleString('fr-FR')}</span>
                          <span className="text-xs sm:text-sm text-stone-500"> FCFA</span>
                        </p>
                      </div>

                      {product.productionTime && (
                        <p className="text-xs text-stone-400 mt-1 sm:mt-2 items-center gap-1 hidden sm:flex">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Confection en {product.productionTime} jours
                        </p>
                      )}
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
          <Link
            href="/contact"
            className="inline-block border border-white text-white px-8 py-3.5 text-sm tracking-[0.15em] uppercase font-medium hover:bg-white hover:text-stone-900 transition-all duration-300"
          >
            Nous contacter
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
