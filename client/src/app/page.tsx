import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import ProductCardActions from "@/components/ProductCardActions";
import HeroDynamicGallery from "@/components/HeroDynamicGallery";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ibag Couture | Haute Couture Africaine Sur Mesure",
  description:
    "Découvrez Ibag Couture, maison de haute couture africaine. Robes, costumes et tenues traditionnelles confectionnés sur mesure par nos artisans. Livraison Afrique & Europe.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ibag Couture | Haute Couture Africaine Sur Mesure",
    description:
      "Maison de couture africaine sur mesure. Chaque pièce est confectionnée à la main, selon vos mesures exactes, pour sublimer votre élégance.",
    url: "/",
  },
};

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
  hasStock?: boolean;
  stockQuantity?: number | null;
  promoPrice?: number | null;
};

type ApiResponse = {
  success: boolean;
  data: Product[];
};

export default async function Home() {
  let products: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/products?limit=200`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      products = data?.data || [];
    }
  } catch {
    // API not available
  }

  // Selection intelligente : on prend les 8 premiers produits du tri intelligent backend,
  // puis on rearrange pour garantir la diversite des categories cote affichage
  const pickDiverse = (items: Product[], count: number): Product[] => {
    if (items.length <= count) return items;
    const result: Product[] = [];
    const pool = [...items.slice(0, count * 2)]; // pool elargi
    const catCount: Record<string, number> = {};

    while (result.length < count && pool.length > 0) {
      // Trouver le produit dont la categorie est la moins representee
      let bestIdx = 0;
      let bestCount = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const cc = catCount[pool[i].category] || 0;
        if (cc < bestCount) {
          bestCount = cc;
          bestIdx = i;
        }
      }
      const picked = pool.splice(bestIdx, 1)[0];
      catCount[picked.category] = (catCount[picked.category] || 0) + 1;
      result.push(picked);
    }
    return result;
  };

  const featured = pickDiverse(products, 8);

  // Extract hero images from products with images (random selection)
  const heroImages = products
    .filter((p) => p.mainImage || (p.images && p.images.length > 0))
    .slice(0, 20) // Limit pool for performance
    .map((p) => ({
      url: p.mainImage || (p.images && p.images[0]) || "",
      alt: p.name,
    }));

  // Always show all 4 categories with product images
  const allCategories = [
    { slug: "homme", label: "Homme" },
    { slug: "femme", label: "Femme" },
    { slug: "traditionnel", label: "Traditionnel" },
    { slug: "moderne", label: "Moderne" },
  ];

  const categories = allCategories.map((cat) => {
    const catProducts = products.filter((p) => p.category.toLowerCase() === cat.slug);
    const firstWithImage = catProducts.find((p) => p.mainImage || (p.images && p.images.length > 0));
    const img = firstWithImage
      ? firstWithImage.mainImage || (firstWithImage.images && firstWithImage.images[0])
      : undefined;
    return { ...cat, count: catProducts.length, image: img };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "Ibag Couture",
    description:
      "Maison de haute couture africaine sur mesure. Robes, costumes et tenues traditionnelles confectionnés artisanalement.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com"}/logo.png`,
    priceRange: "$$",
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Couture sur mesure",
        description: "Confection artisanale de vêtements sur mesure alliant traditions africaines et élégance contemporaine.",
      },
    },
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══════════════ HERO - LUXURY ═══════════════ */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] lg:min-h-[92vh] flex items-center overflow-hidden">
        {/* Dynamic product slideshow background */}
        <HeroDynamicGallery
          images={heroImages}
          fallbackImage="/images/IMG_1991.PNG"
          interval={7000}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full py-20 md:py-24">
          <div className="max-w-2xl lg:max-w-3xl">
            <p className="text-amber-300 text-sm md:text-base tracking-[0.35em] uppercase mb-6 md:mb-8 font-light animate-fadeInUp text-shadow-luxury">
              Haute Couture Africaine
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-luxury text-white leading-[1.1] mb-6 md:mb-8 animate-fadeInUp text-shadow-luxury">
              L&apos;élégance sur mesure,
              <br />
              <span className="italic font-light">pensée pour vous</span>
            </h1>
            <p className="text-stone-200 text-base md:text-lg lg:text-xl max-w-lg mb-10 md:mb-12 leading-relaxed animate-fadeInUp text-shadow-luxury">
              Chaque pièce est confectionnée à la main, selon vos mesures exactes, 
              pour sublimer votre élégance naturelle.
            </p>
            <Link
              href="/collections"
              className="inline-block bg-white text-stone-900 px-10 sm:px-12 lg:px-14 py-4 sm:py-5 lg:py-6 text-xs sm:text-sm lg:text-base tracking-[0.25em] uppercase font-medium hover:bg-stone-50 hover:shadow-2xl transition-all duration-500 animate-fadeInUp hover:scale-105"
            >
              Découvrir la collection
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRODUITS VEDETTES - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between mb-12 md:mb-16 lg:mb-20">
            <div className="max-w-2xl">
              <p className="text-amber-700 text-xs md:text-sm tracking-[0.35em] uppercase mb-3 md:mb-4 font-light">
                Nos Créations
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 leading-tight">
                Créations phares
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden sm:inline-flex items-center gap-2 text-sm lg:text-base text-stone-600 tracking-wide hover:text-stone-900 transition-all duration-300 group"
            >
              Tout voir
              <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-center text-stone-500 py-16 md:py-20 text-lg">
              Nos collections arrivent bientôt…
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
              {featured.map((product) => {
                const isOutOfStock = product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0);
                return (
                  <article
                    key={product._id}
                    className="group hover-scale hover-shadow"
                  >
                    <Link href={`/produits/${product.slug || product._id}`}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden mb-3 sm:mb-5 rounded-sm">
                        {(product.mainImage || (product.images && product.images.length > 0)) ? (
                          <img
                            src={(() => {
                              const imgUrl = product.mainImage || product.images![0];
                              if (imgUrl.startsWith("http")) return imgUrl;
                              return `${API_URL}${imgUrl}`;
                            })()}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5">
                          <span className="bg-white/95 backdrop-blur-sm text-stone-900 text-[10px] sm:text-xs tracking-[0.15em] uppercase px-2.5 py-1 sm:px-3 sm:py-1.5 font-light">
                            {product.category}
                          </span>
                          {product.promoPrice != null && product.promoPrice < product.basePrice && (
                            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1">
                              -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                            </span>
                          )}
                        </div>

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-stone-900/90 text-white text-xs sm:text-sm px-5 py-2 tracking-[0.15em] uppercase font-light">
                              Rupture de stock
                            </span>
                          </div>
                        )}

                        {!isOutOfStock && (
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-all duration-700 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-7 py-3 text-xs sm:text-sm tracking-[0.2em] uppercase font-light shadow-lg">
                              Voir le modèle
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="px-1">
                      <Link href={`/produits/${product.slug || product._id}`}>
                        <h3 className="font-luxury text-base sm:text-lg lg:text-xl text-stone-900 mb-1 sm:mb-2 group-hover:text-stone-600 transition-colors duration-300 line-clamp-1 sm:line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline justify-between mb-3">
                        {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                          <div className="flex flex-col">
                            <p className="text-sm sm:text-base lg:text-lg">
                              <span className="font-medium text-red-700">{product.promoPrice.toLocaleString("fr-FR")}</span>
                              <span className="text-xs text-stone-500 ml-1">FCFA</span>
                            </p>
                            <span className="text-stone-400 line-through text-xs sm:text-sm">{product.basePrice.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                        ) : (
                          <p className="text-stone-900 text-sm sm:text-base lg:text-lg">
                            <span className="font-medium font-luxury">{product.basePrice.toLocaleString("fr-FR")}</span>
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
                        isOutOfStock={isOutOfStock}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12 md:mt-16 sm:hidden">
            <Link
              href="/collections"
              className="inline-block border-2 border-stone-900 text-stone-900 px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-500 font-medium"
            >
              Voir toutes les créations
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <p className="text-amber-700 text-xs md:text-sm tracking-[0.35em] uppercase mb-3 md:mb-4 font-light">
              Explorer
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 leading-tight">
              Nos catégories
            </h2>
          </div>

          <div className="flex justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
            {categories.map((cat) => {
              const imgSrc = cat.image
                ? cat.image.startsWith("http") ? cat.image : `${API_URL}${cat.image}`
                : null;
              return (
                <Link
                  key={cat.slug}
                  href={`/collections?category=${cat.slug}`}
                  className="group flex flex-col items-center text-center hover-scale"
                >
                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-2 border-stone-200 group-hover:border-stone-400 transition-all duration-500 shadow-lg group-hover:shadow-2xl mb-4 sm:mb-5">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-luxury text-base sm:text-lg md:text-xl text-stone-900 group-hover:text-stone-600 transition-colors duration-300 mb-1">{cat.label}</h3>
                  <p className="text-xs sm:text-sm text-stone-400">{cat.count} article{cat.count > 1 ? "s" : ""}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ POURQUOI IBAG COUTURE - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 leading-tight">
              Pourquoi Ibag Couture
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-all duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-luxury text-base sm:text-lg md:text-xl text-stone-900 mb-2">Sur mesure</h3>
              <p className="text-sm md:text-base text-stone-500 leading-relaxed">Selon vos mesures exactes</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-all duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="font-luxury text-base sm:text-lg md:text-xl text-stone-900 mb-2">Confection artisanale</h3>
              <p className="text-sm md:text-base text-stone-500 leading-relaxed">Cousu main avec soin</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-all duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="font-luxury text-base sm:text-lg md:text-xl text-stone-900 mb-2">Livraison 24–72h</h3>
              <p className="text-sm md:text-base text-stone-500 leading-relaxed">Rapide à Dakar</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-all duration-500 group-hover:scale-110">
                <svg className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-luxury text-base sm:text-lg md:text-xl text-stone-900 mb-2">Qualité premium</h3>
              <p className="text-sm md:text-base text-stone-500 leading-relaxed">Tissus nobles & finitions soignées</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NOTRE HISTOIRE - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-2xl hover-shadow hover-scale">
              <Image
                src="/images/IMG_1991.PNG"
                alt="Atelier Ibag Couture"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="md:pl-4 lg:pl-8">
              <p className="text-amber-700 text-xs md:text-sm tracking-[0.35em] uppercase mb-4 md:mb-6 font-light">
                Notre Maison
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 mb-6 md:mb-8 leading-tight">
                Là où le tissu
                <br />
                <span className="italic font-light">rencontre l&apos;âme</span>
              </h2>
              <p className="text-stone-600 leading-relaxed text-base md:text-lg lg:text-xl mb-10 md:mb-12">
                Chez Ibag Couture, chaque vêtement commence par une écoute.
                Nous ne fabriquons pas du prêt-à-porter —
                nous façonnons des pièces qui vous ressemblent.
              </p>
              <div className="flex gap-12 lg:gap-16 mb-10 md:mb-12">
                <div>
                  <p className="text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 mb-2">150+</p>
                  <p className="text-sm md:text-base text-stone-500 tracking-wide">Créations uniques</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 mb-2">100%</p>
                  <p className="text-sm md:text-base text-stone-500 tracking-wide">Sur mesure</p>
                </div>
              </div>
              <Link
                href="/collections"
                className="inline-flex items-center gap-3 text-sm md:text-base text-stone-900 tracking-[0.2em] uppercase border-b-2 border-stone-900 pb-2 hover:text-stone-600 hover:border-stone-600 transition-all duration-300 group"
              >
                Découvrir nos créations
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ RÉASSURANCE - LUXURY ═══════════════ */}
      <section className="py-10 md:py-14 lg:py-16 bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 text-sm md:text-base tracking-wide">
            <span className="flex items-center gap-3 text-stone-200 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-3 text-stone-200 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Livraison rapide
            </span>
            <span className="flex items-center gap-3 text-stone-200 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Assistance WhatsApp
            </span>
            <span className="flex items-center gap-3 text-stone-200 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Retouches incluses
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-amber-50 to-stone-50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 mb-6 md:mb-8 leading-tight">
            Prêt à créer un vêtement
            <br />
            <span className="italic font-light">qui vous ressemble ?</span>
          </h2>
          <p className="text-stone-600 mb-10 md:mb-12 text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
            Parcourez nos collections ou contactez-nous directement pour une création sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
            <Link
              href="/collections"
              className="inline-block bg-stone-900 text-white px-10 md:px-12 lg:px-14 py-4 md:py-5 lg:py-6 text-sm md:text-base tracking-[0.25em] uppercase hover:bg-stone-800 hover:shadow-2xl transition-all duration-500 font-medium hover:scale-105"
            >
              Découvrir la collection
            </Link>
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20commander%20sur%20mesure."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border-2 border-[#25D366] text-[#25D366] px-10 md:px-12 lg:px-14 py-4 md:py-5 lg:py-6 text-sm md:text-base tracking-[0.2em] uppercase hover:bg-[#25D366] hover:text-white transition-all duration-500 font-medium hover:scale-105"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Commander sur mesure
            </a>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
