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

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center pt-10 md:pt-12 overflow-hidden">
        {/* Dynamic product slideshow background */}
        <HeroDynamicGallery
          images={heroImages}
          fallbackImage="/images/IMG_1991.PNG"
          interval={6000}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 w-full">
          <div className="max-w-xl">
            <p className="text-amber-400 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              Haute Couture Africaine
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-5">
              L&apos;&eacute;l&eacute;gance sur mesure,
              <br />
              <span className="italic font-light">pens&eacute;e pour vous</span>
            </h1>
            <p className="text-stone-300 text-sm md:text-base max-w-md mb-8 leading-relaxed">
              Chaque pi&egrave;ce est confectionn&eacute;e &agrave; la main, selon vos mesures exactes.
            </p>
            <Link
              href="/collections"
              className="inline-block bg-white text-stone-900 px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm tracking-[0.2em] uppercase font-medium hover:bg-amber-50 transition-all duration-300"
            >
              D&eacute;couvrir la collection
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRODUITS VEDETTES ═══════════════ */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-2 font-medium">
                Nos Cr&eacute;ations
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900">
                Cr&eacute;ations phares
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-stone-600 tracking-wide hover:text-amber-700 transition-colors"
            >
              Tout voir
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-center text-stone-500 py-12">
              Nos collections arrivent bient&ocirc;t&hellip;
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {featured.map((product) => {
                const isOutOfStock = product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0);
                return (
                  <article
                    key={product._id}
                    className="group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <Link href={`/produits/${product.slug || product._id}`}>
                      <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden mb-2 sm:mb-4">
                        {(product.mainImage || (product.images && product.images.length > 0)) ? (
                          <img
                            src={(() => {
                              const imgUrl = product.mainImage || product.images![0];
                              if (imgUrl.startsWith("http")) return imgUrl;
                              return `${API_URL}${imgUrl}`;
                            })()}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

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

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="bg-stone-900/80 text-white text-xs sm:text-sm px-4 py-1.5 tracking-wide uppercase">
                              Rupture de stock
                            </span>
                          </div>
                        )}

                        {!isOutOfStock && (
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-500 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-6 py-2 text-sm tracking-wide">
                              Voir le mod&egrave;le
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div>
                      <Link href={`/produits/${product.slug || product._id}`}>
                        <h3 className="font-serif text-sm sm:text-lg text-stone-900 mb-0.5 sm:mb-1 group-hover:text-amber-700 transition-colors line-clamp-1 sm:line-clamp-none">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                          <p className="text-xs sm:text-base">
                            <span className="font-medium text-red-700">{product.promoPrice.toLocaleString("fr-FR")}</span>
                            <span className="text-xs sm:text-sm text-stone-500"> FCFA</span>
                            <span className="ml-1.5 text-stone-400 line-through text-[10px] sm:text-sm">{product.basePrice.toLocaleString("fr-FR")}</span>
                          </p>
                        ) : (
                          <p className="text-stone-900 text-xs sm:text-base">
                            <span className="hidden sm:inline text-sm text-stone-500">&Agrave; partir de </span>
                            <span className="font-medium">{product.basePrice.toLocaleString("fr-FR")}</span>
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
                        isOutOfStock={isOutOfStock}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link
              href="/collections"
              className="inline-block border border-stone-900 text-stone-900 px-8 py-3 text-sm tracking-[0.15em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-300"
            >
              Voir toutes les cr&eacute;ations
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      <section className="py-14 md:py-20 bg-stone-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-2 font-medium">
              Explorer
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900">
              Nos cat&eacute;gories
            </h2>
          </div>

          <div className="flex justify-center gap-6 sm:gap-10 md:gap-14">
            {categories.map((cat) => {
              const imgSrc = cat.image
                ? cat.image.startsWith("http") ? cat.image : `${API_URL}${cat.image}`
                : null;
              return (
                <Link
                  key={cat.slug}
                  href={`/collections?category=${cat.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative w-[72px] h-[72px] sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-stone-200 group-hover:border-amber-600 transition-all duration-300 shadow-md group-hover:shadow-xl mb-3 sm:mb-4">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-sm sm:text-base text-stone-900 group-hover:text-amber-700 transition-colors">{cat.label}</h3>
                  <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5">{cat.count} article{cat.count > 1 ? "s" : ""}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ POURQUOI IBAG COUTURE ═══════════════ */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900">
              Pourquoi Ibag Couture
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-serif text-sm sm:text-base text-stone-900 mb-1">Sur mesure</h3>
              <p className="text-xs sm:text-sm text-stone-500">Selon vos mesures exactes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="font-serif text-sm sm:text-base text-stone-900 mb-1">Confection artisanale</h3>
              <p className="text-xs sm:text-sm text-stone-500">Cousu main avec soin</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="font-serif text-sm sm:text-base text-stone-900 mb-1">Livraison 24&ndash;72h</h3>
              <p className="text-xs sm:text-sm text-stone-500">Rapide &agrave; Dakar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-serif text-sm sm:text-base text-stone-900 mb-1">Qualit&eacute; premium</h3>
              <p className="text-xs sm:text-sm text-stone-500">Tissus nobles &amp; finitions soign&eacute;es</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NOTRE HISTOIRE (RÉSUMÉ) ═══════════════ */}
      <section className="py-14 md:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-xl">
              <Image
                src="/images/IMG_1991.PNG"
                alt="Atelier Ibag Couture"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-3 font-medium">
                Notre Maison
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 mb-5 leading-tight">
                L&agrave; o&ugrave; le tissu
                <br />
                <span className="italic font-light">rencontre l&apos;&acirc;me</span>
              </h2>
              <p className="text-stone-600 leading-relaxed text-sm md:text-base mb-8">
                Chez Ibag Couture, chaque v&ecirc;tement commence par une &eacute;coute.
                Nous ne fabriquons pas du pr&ecirc;t-&agrave;-porter &mdash;
                nous fa&ccedil;onnons des pi&egrave;ces qui vous ressemblent.
              </p>
              <div className="flex gap-10 mb-8">
                <div>
                  <p className="text-3xl md:text-4xl font-serif text-stone-900">150+</p>
                  <p className="text-xs text-stone-500 tracking-wide mt-1">Cr&eacute;ations uniques</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-serif text-stone-900">100%</p>
                  <p className="text-xs text-stone-500 tracking-wide mt-1">Sur mesure</p>
                </div>
              </div>
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-sm text-stone-900 tracking-[0.15em] uppercase border-b border-stone-900 pb-1 hover:text-amber-700 hover:border-amber-700 transition-colors duration-300"
              >
                D&eacute;couvrir nos cr&eacute;ations
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ RÉASSURANCE ═══════════════ */}
      <section className="py-8 md:py-10 bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-xs sm:text-sm tracking-wide">
            <span className="flex items-center gap-2 text-stone-300">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Paiement s&eacute;curis&eacute;
            </span>
            <span className="flex items-center gap-2 text-stone-300">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Livraison rapide
            </span>
            <span className="flex items-center gap-2 text-stone-300">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Assistance WhatsApp
            </span>
            <span className="flex items-center gap-2 text-stone-300">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Retouches incluses
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="py-14 md:py-20 bg-amber-50/60">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 mb-4 leading-snug">
            Pr&ecirc;t &agrave; cr&eacute;er un v&ecirc;tement
            <br />
            <span className="italic font-light">qui vous ressemble ?</span>
          </h2>
          <p className="text-stone-600 mb-8 text-sm md:text-base">
            Parcourez nos collections ou contactez-nous directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/collections"
              className="inline-block bg-stone-900 text-white px-10 py-4 text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-stone-800 transition-all duration-300 font-medium"
            >
              D&eacute;couvrir la collection
            </Link>
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20commander%20sur%20mesure."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] px-10 py-4 text-xs sm:text-sm tracking-[0.15em] uppercase hover:bg-[#25D366] hover:text-white transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
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
