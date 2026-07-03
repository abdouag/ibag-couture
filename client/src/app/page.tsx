import Link from "next/link";
import Footer from "@/components/Footer";
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
    } else {
      console.error(`[Home] API responded ${res.status} at ${API_URL}/api/products`);
    }
  } catch (err) {
    console.error(`[Home] API fetch failed at ${API_URL}/api/products:`, err);
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
        const cc = catCount[pool[i].category ?? ""] || 0;
        if (cc < bestCount) {
          bestCount = cc;
          bestIdx = i;
        }
      }
      const picked = pool.splice(bestIdx, 1)[0];
      const pickedCat = picked.category ?? "";
      catCount[pickedCat] = (catCount[pickedCat] || 0) + 1;
      result.push(picked);
    }
    return result;
  };

  // Prioritize in-stock products for the featured grid
  const inStockProducts = products.filter((p) => p.hasStock !== false && p.hasStock !== null);
  const featured = pickDiverse(inStockProducts.length >= 8 ? inStockProducts : products, 8);

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
    const catProducts = products.filter((p) => (p.category ?? "").toLowerCase() === cat.slug);
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
    <main className="min-h-screen bg-[#F5F5F5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ═══════════════ HERO - LUXURY ═══════════════ */}
      <section className="relative min-h-[75vh] md:min-h-[90vh] flex items-end overflow-hidden">
        {/* Dynamic product slideshow background */}
        <HeroDynamicGallery
          images={heroImages}
          fallbackImage="/images/IMG_1991.PNG"
          interval={7000}
        />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-10 pb-16 md:pb-24">
          <p className="label-gold mb-4">IBAG COUTURE — DAKAR</p>
          <h1 className="font-luxury text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-light leading-[1.1] mb-6">
            L&apos;élégance africaine,<br />
            <em>redéfinie</em>
          </h1>
          <div className="flex flex-wrap gap-4">
            <Link href="/collections" className="btn-luxury-gold">
              Découvrir la collection
            </Link>
            <Link href="/collections?category=traditionnel" className="btn-luxury-outline">
              Sur-mesure
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRODUITS VEDETTES - LUXURY ═══════════════ */}
      <section className="py-20 md:py-28 lg:py-36 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 md:mb-16">
            <p className="label-gold mb-3">NOS CRÉATIONS</p>
            <h2 className="font-luxury text-3xl md:text-4xl text-[#0D0D0D]">Créations Phares</h2>
          </div>

          {featured.length === 0 ? (
            <p className="text-center text-[#0D0D0D]/50 py-16 md:py-20 text-lg">
              Nos collections arrivent bientôt…
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {featured.map((product) => {
                const isOutOfStock = product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0);
                const isLowStock = product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity < 3;
                const mainImgUrl = product.mainImage
                  ? (product.mainImage.startsWith("http") ? product.mainImage : `${API_URL}${product.mainImage}`)
                  : (product.images && product.images.length > 0)
                    ? (product.images[0].startsWith("http") ? product.images[0] : `${API_URL}${product.images[0]}`)
                    : null;
                const secondImgUrl = product.images && product.images.length > 1
                  ? (product.images[1].startsWith("http") ? product.images[1] : `${API_URL}${product.images[1]}`)
                  : product.images && product.images.length > 0
                    ? (product.images[0].startsWith("http") ? product.images[0] : `${API_URL}${product.images[0]}`)
                    : null;
                return (
                  <Link
                    key={product._id}
                    href={`/produits/${product.slug || product._id}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-[#E8E4E0] mb-3">
                      {mainImgUrl ? (
                        <>
                          <img
                            src={mainImgUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {secondImgUrl && (
                            <img
                              src={secondImgUrl}
                              alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
                            />
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#0D0D0D]/30">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="bg-[#0D0D0D] text-[#C9A45C] text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 font-medium">
                          Nouveau
                        </span>
                        {product.promoPrice != null && product.promoPrice < product.basePrice && (
                          <span className="bg-[#C9A45C] text-white text-[9px] font-semibold px-2 py-0.5">
                            -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                          </span>
                        )}
                        {isLowStock && (
                          <span className="bg-[#D97706] text-white text-[9px] font-semibold px-2 py-0.5">
                            Dernières pièces
                          </span>
                        )}
                      </div>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-[#0D0D0D]/90 text-white text-xs px-5 py-2 tracking-[0.15em] uppercase font-light">
                            Rupture de stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-0.5">
                      <p className="text-[#C9A45C] text-[9px] uppercase tracking-[0.15em] mb-0.5">{product.category}</p>
                      <h3 className="font-luxury text-sm md:text-[15px] text-[#0D0D0D] truncate mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                          <>
                            <span className="text-[15px] font-semibold text-[#0D0D0D]">{product.promoPrice.toLocaleString("fr-FR")} FCFA</span>
                            <span className="text-xs text-[#0D0D0D]/40 line-through">{product.basePrice.toLocaleString("fr-FR")} FCFA</span>
                          </>
                        ) : (
                          <span className="text-[15px] font-semibold text-[#0D0D0D]">{product.basePrice.toLocaleString("fr-FR")} FCFA</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12 md:mt-16">
            <Link href="/collections" className="btn-luxury-gold">
              Voir toutes les créations
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ VALEURS / RÉASSURANCE ═══════════════ */}
      <section className="py-16 md:py-20 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/10">
            {[
              { icon: "truck", title: "Livraison rapide", desc: "24–72h à Dakar et environs" },
              { icon: "sparkle", title: "Qualité premium", desc: "Tissus sélectionnés, couture artisanale" },
              { icon: "lock", title: "Paiement sécurisé", desc: "Vos données protégées" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center md:px-8">
                <div className="text-[#C9A45C] mb-4">
                  {item.icon === "truck" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  )}
                  {item.icon === "sparkle" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  )}
                  {item.icon === "lock" && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-white text-sm font-medium tracking-wide mb-2">{item.title}</h3>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CATEGORIES - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <p className="label-gold mb-3">EXPLORER</p>
            <h2 className="font-luxury text-3xl sm:text-4xl md:text-5xl text-[#0D0D0D] leading-tight">
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
                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-2 border-[#E8E4E0] group-hover:border-[#C9A45C] transition-all duration-500 shadow-lg group-hover:shadow-2xl mb-4 sm:mb-5">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E8E4E0] flex items-center justify-center">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#0D0D0D]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-luxury text-base sm:text-lg md:text-xl text-[#0D0D0D] group-hover:text-[#C9A45C] transition-colors duration-300 mb-1">{cat.label}</h3>
                  <p className="text-xs sm:text-sm text-[#0D0D0D]/40">{cat.count} article{cat.count > 1 ? "s" : ""}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className="py-20 md:py-28 bg-[#0D0D0D]">
        <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
          <div className="w-12 h-[1px] bg-[#C9A45C] mx-auto mb-8" />
          <h2 className="font-luxury text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Commandez votre style aujourd&apos;hui
          </h2>
          <p className="text-white/50 text-sm md:text-base mb-10 max-w-2xl mx-auto">
            Créations sur-mesure et prêt-à-porter de luxe africain
          </p>
          <Link href="/collections" className="btn-luxury-gold">
            Voir la collection
          </Link>
          <div className="w-12 h-[1px] bg-[#C9A45C] mx-auto mt-8" />
        </div>
      </section>

      {/* ═══════════════ RÉASSURANCE - LUXURY ═══════════════ */}
      <section className="py-10 md:py-14 lg:py-16 bg-[#0D0D0D] text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 text-sm md:text-base tracking-wide">
            <span className="flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C9A45C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C9A45C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Livraison rapide
            </span>
            <span className="flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C9A45C]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Assistance WhatsApp
            </span>
            <span className="flex items-center gap-3 text-white/60 hover:text-white transition-colors duration-300">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#C9A45C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Retouches incluses
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL - LUXURY ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32 bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="font-luxury text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#0D0D0D] mb-6 md:mb-8 leading-tight">
            Prêt à créer un vêtement
            <br />
            <em className="font-light">qui vous ressemble ?</em>
          </h2>
          <p className="text-[#0D0D0D]/60 mb-10 md:mb-12 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Parcourez nos collections ou contactez-nous directement pour une création sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
            <Link href="/collections" className="btn-luxury-gold">
              Découvrir la collection
            </Link>
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20je%20souhaite%20commander%20sur%20mesure."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-[#25D366] text-[#25D366] px-8 py-3 text-xs tracking-[0.2em] uppercase hover:bg-[#25D366] hover:text-white transition-all duration-500 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
