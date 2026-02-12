import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import DeliveryInfo from "@/components/DeliveryInfo";
import ContactWhatsAppButton from "@/components/ContactWhatsAppButton";
import ShareButtons from "@/components/ShareButtons";
import SimilarProducts from "@/components/SimilarProducts";
import ProductDescription from "@/components/ProductDescription";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Option = {
  name: string;
  price: number;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: string;
  description?: string;
  mainImage?: string;
  images?: string[];
  availableSizes?: string[];
  isCustomAvailable?: boolean;
  customPriceImpact?: number;
  options?: Option[];
  productionTime?: number;
  isActive?: boolean;
  hasStock?: boolean;
  stockQuantity?: number | null;
  promoPrice?: number | null;
};

type ApiResponse = {
  success: boolean;
  data: Product;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, { cache: "no-store" });
    if (!res.ok) return { title: "Produit — Ibag Couture" };
    const data: ApiResponse = await res.json();
    const product = data?.data;
    if (!product?.name) return { title: "Produit — Ibag Couture" };

    const description =
      product.description ||
      `Découvrez ${product.name}, création sur mesure par Ibag Couture. Confection artisanale, haute couture africaine.`;

    const imageUrl = product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : null);
    const ogImage = imageUrl
      ? imageUrl.startsWith("http") ? imageUrl : `${API_URL}${imageUrl}`
      : undefined;

    return {
      title: `${product.name} — Création Sur Mesure`,
      description,
      alternates: { canonical: `/produits/${slug}` },
      openGraph: {
        title: `${product.name} | Ibag Couture`,
        description,
        url: `/produits/${slug}`,
        type: "website",
        ...(ogImage && {
          images: [{ url: ogImage, alt: `${product.name} — Ibag Couture` }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Ibag Couture`,
        description,
        ...(ogImage && { images: [ogImage] }),
      },
    };
  } catch {
    return {
      title: "Produit — Ibag Couture",
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product: Product | null = null;

  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      product = data?.data || null;
    }
  } catch {
    // API unreachable
  }

  if (!product) {
    notFound();
  }

  const displayPrice = product.promoPrice != null && product.promoPrice < product.basePrice
    ? product.promoPrice
    : product.basePrice;

  const totalWithOptions = product.options?.reduce(
    (sum, opt) => sum + opt.price,
    displayPrice
  ) || displayPrice;

  const isOutOfStock = product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com";
  const imageUrl = product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : null);
  const ogImage = imageUrl
    ? imageUrl.startsWith("http") ? imageUrl : `${API_URL}${imageUrl}`
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name}, création sur mesure par Ibag Couture.`,
    ...(ogImage && { image: ogImage }),
    brand: {
      "@type": "Brand",
      name: "Ibag Couture",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produits/${product.slug}`,
      priceCurrency: "XOF",
      price: displayPrice,
      availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    category: product.category,
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb - LUXURY */}
      <div className="pt-6 md:pt-8 lg:pt-10 pb-4 md:pb-6 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <nav className="flex items-center gap-2 text-sm md:text-base text-stone-400">
            <Link href="/" className="hover:text-stone-900 transition-colors duration-300">
              Accueil
            </Link>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/collections" className="hover:text-stone-900 transition-colors duration-300">
              Collections
            </Link>
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-stone-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section - LUXURY */}
      <section className="py-8 md:py-12 lg:py-16 xl:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8 lg:gap-12 xl:gap-20">

            {/* Image Gallery */}
            <ProductGallery
              mainImage={product.mainImage}
              images={product.images}
              category={product.category}
              productName={product.name}
            />

            {/* Product Info - LUXURY */}
            <div className="lg:py-4">
              <div className="sticky top-24 md:top-28 lg:top-32 space-y-6 md:space-y-8">

                {/* Title Section - LUXURY */}
                <div>
                  <p className="text-amber-700 text-xs md:text-sm tracking-[0.35em] uppercase mb-3 md:mb-4 font-light">
                    Création sur mesure
                  </p>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 leading-tight mb-3">
                    {product.name}
                  </h1>
                  <p className="text-stone-500 text-sm md:text-base tracking-wide uppercase">{product.category}</p>
                </div>

                {/* Stock Badge - LUXURY */}
                {product.hasStock && (
                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-stone-100 border border-stone-200 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <span className="text-sm md:text-base text-stone-500 font-medium">Rupture de stock</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-stock-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-sm md:text-base text-emerald-700 font-medium">En stock ({product.stockQuantity})</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Section - LUXURY */}
                <div className="bg-white rounded-sm p-6 md:p-8 border border-stone-200 shadow-lg">
                  {product.promoPrice != null && product.promoPrice < product.basePrice ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs md:text-sm font-semibold rounded tracking-wide uppercase">
                          -{Math.round((1 - product.promoPrice / product.basePrice) * 100)}%
                        </span>
                        <span className="text-stone-400 text-sm md:text-base font-medium">Promotion</span>
                      </div>
                      <div className="flex items-baseline gap-4 mb-2">
                        <p className="text-4xl md:text-5xl lg:text-6xl font-luxury text-red-700 tracking-tight">
                          {product.promoPrice.toLocaleString('fr-FR')}
                        </p>
                        <span className="text-sm text-stone-400 tracking-wide uppercase">FCFA</span>
                      </div>
                      <p className="text-stone-400 text-lg line-through">
                        {product.basePrice.toLocaleString('fr-FR')} FCFA
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-stone-500 text-sm md:text-base">Prix</span>
                        <span className="text-sm text-stone-400 tracking-wide uppercase">FCFA</span>
                      </div>
                      <p className="text-4xl md:text-5xl lg:text-6xl font-luxury text-stone-900 tracking-tight">
                        {product.basePrice.toLocaleString('fr-FR')}
                      </p>
                    </>
                  )}

                  {product.options && product.options.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-200">
                      <div className="flex items-baseline justify-between">
                        <span className="text-stone-600 font-medium text-base md:text-lg">Total avec options</span>
                        <span className="text-2xl md:text-3xl font-luxury text-amber-700 font-medium">
                          {totalWithOptions.toLocaleString('fr-FR')} <span className="text-base font-normal">FCFA</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description - Collapsible */}
                {product.description && (
                  <ProductDescription description={product.description} />
                )}

                {/* Options - LUXURY */}
                {product.options && product.options.length > 0 && (
                  <div>
                    <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-stone-400 mb-5 font-light">
                      Options incluses
                    </h2>
                    <div className="space-y-3">
                      {product.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 md:p-5 bg-stone-50 rounded-sm border border-stone-100 hover:border-stone-300 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-stone-800 text-base md:text-lg">{option.name}</span>
                          </div>
                          <span className="text-stone-600 text-sm md:text-base font-medium">
                            +{option.price.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Sizes - LUXURY */}
                {product.availableSizes && product.availableSizes.length > 0 && (
                  <div>
                    <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-stone-400 mb-4 font-light">
                      Tailles disponibles
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {product.availableSizes.map((size) => (
                        <span
                          key={size}
                          className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border-2 border-stone-200 text-stone-700 text-base md:text-lg font-medium rounded-sm hover:border-stone-400 hover:shadow-md transition-all duration-300 cursor-pointer"
                        >
                          {size}
                        </span>
                      ))}
                      {product.isCustomAvailable && (
                        <span className="h-14 md:h-16 px-5 md:px-6 flex items-center justify-center border-2 border-amber-200 bg-amber-50 text-amber-700 text-sm md:text-base font-medium rounded-sm hover:bg-amber-100 transition-all duration-300">
                          Sur-mesure
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sur-mesure only - LUXURY */}
                {(!product.availableSizes || product.availableSizes.length === 0) && product.isCustomAvailable && (
                  <div className="flex items-center gap-4 bg-amber-50 p-5 md:p-6 rounded-sm border border-amber-200 shadow-sm">
                    <svg className="w-6 h-6 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm md:text-base text-stone-700">
                      Ce modèle est disponible uniquement <strong>sur-mesure</strong>
                      {product.customPriceImpact && product.customPriceImpact > 0
                        ? ` (+${product.customPriceImpact.toLocaleString('fr-FR')} FCFA)`
                        : ""}
                    </span>
                  </div>
                )}

                {/* Delivery Info */}
                <DeliveryInfo />

                {/* CTA Buttons - LUXURY */}
                <div className="space-y-4 md:space-y-5">
                  {isOutOfStock ? (
                    <div className="block w-full bg-stone-300 text-white text-center py-5 md:py-6 text-base md:text-lg tracking-[0.2em] uppercase font-medium cursor-not-allowed rounded-sm">
                      <span className="flex items-center justify-center gap-3">
                        Indisponible
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={`/commander/${product.slug || product._id}`}
                      className="group relative block w-full bg-stone-900 text-white text-center py-5 md:py-6 lg:py-7 text-base md:text-lg tracking-[0.2em] uppercase font-medium overflow-hidden transition-all duration-500 hover:bg-stone-800 hover:shadow-2xl rounded-sm hover:scale-[1.02]"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        Commander ce modèle
                        <svg className="w-5 h-5 md:w-6 md:h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                        </svg>
                      </span>
                    </Link>
                  )}

                  {!isOutOfStock && <AddToCartButton
                    product={{
                      productId: product._id,
                      slug: product.slug,
                      name: product.name,
                      category: product.category,
                      basePrice: product.basePrice,
                      promoPrice: product.promoPrice,
                      mainImage: product.mainImage,
                    }}
                  />}

                  {product.isCustomAvailable && (
                    <p className="text-center text-sm md:text-base text-stone-500 leading-relaxed">
                      Vous serez guidé pour fournir vos mesures personnalisées
                    </p>
                  )}

                  <ContactWhatsAppButton productName={product.name} />
                </div>

                {/* Trust Badges - LUXURY */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200">
                  <div className="text-center p-3 group">
                    <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-3 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-all duration-300">
                      <svg className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <p className="text-xs md:text-sm text-stone-500 leading-tight">Paiement<br/>sécurisé</p>
                  </div>
                  <div className="text-center p-3 group">
                    <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-3 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-all duration-300">
                      <svg className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="text-xs md:text-sm text-stone-500 leading-tight">Confection<br/>artisanale</p>
                  </div>
                  <div className="text-center p-3 group">
                    <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-3 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-all duration-300">
                      <svg className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <p className="text-xs md:text-sm text-stone-500 leading-tight">Livraison<br/>24–72h</p>
                  </div>
                </div>

                {/* Social Share */}
                <ShareButtons productName={product.name} slug={product.slug} />

                {/* Additional Info - LUXURY */}
                <div className="flex items-center gap-3 text-stone-400 text-sm md:text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <span>Des questions ? <Link href="/contact" className="text-amber-700 hover:underline transition-colors">Contactez-nous</Link> ou <a href="https://wa.me/221770470928" target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline transition-colors">WhatsApp</a></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Products */}
      <SimilarProducts category={product.category} currentProductId={product._id} />

      {/* Measurements Guide - LUXURY */}
      {product.isCustomAvailable && <section className="py-14 md:py-18 lg:py-20 bg-stone-100">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="bg-white rounded-sm p-8 md:p-12 lg:p-16 shadow-xl">
            <div className="text-center mb-10 md:mb-12">
              <h3 className="font-luxury text-3xl md:text-4xl lg:text-5xl text-stone-900 mb-4">Guide des mesures</h3>
              <p className="text-stone-500 text-base md:text-lg">Chaque pièce est réalisée sur mesure. Vous aurez besoin de :</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
              {["Tour de poitrine", "Tour de taille", "Tour de hanches", "Largeur épaules", "Longueur souhaitée"].map((measure) => (
                <div key={measure} className="flex items-center gap-3 p-4 bg-stone-50 rounded-sm border border-stone-200 hover:border-amber-200 hover:bg-amber-50 transition-all duration-300">
                  <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm md:text-base text-stone-700 font-medium">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* Contact CTA - LUXURY */}
      <section className="py-16 md:py-20 lg:py-24 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-luxury mb-4 md:mb-6">Besoin d&apos;aide ?</h2>
          <p className="text-stone-300 text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed max-w-2xl mx-auto">
            Notre équipe est disponible pour vous accompagner dans votre commande.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center">
            <a
              href="https://wa.me/221770470928?text=Bonjour%20Ibag%20Couture%2C%20j%27ai%20une%20question."
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
              className="inline-flex items-center justify-center gap-3 border-2 border-white text-white px-10 md:px-12 py-4 md:py-5 text-sm md:text-base tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-stone-900 transition-all duration-500 hover:scale-105"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sticky Mobile CTA - LUXURY */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-stone-200 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] z-50 px-5 py-3.5 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            {product.promoPrice != null && product.promoPrice < product.basePrice ? (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-luxury text-red-700 font-medium">
                    {product.promoPrice.toLocaleString('fr-FR')}
                  </p>
                  <span className="text-xs text-stone-500">FCFA</span>
                </div>
                <p className="text-xs text-stone-400 line-through">
                  {product.basePrice.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ) : (
              <p className="text-lg font-luxury text-stone-900 font-medium">
                {product.basePrice.toLocaleString('fr-FR')} <span className="text-sm text-stone-500">FCFA</span>
              </p>
            )}
          </div>
          {isOutOfStock ? (
            <span className="bg-stone-300 text-white px-6 py-3 text-xs tracking-[0.15em] uppercase font-medium cursor-not-allowed rounded-sm">
              Indisponible
            </span>
          ) : (
            <div className="flex items-center gap-2.5">
              <AddToCartButton
                product={{
                  productId: product._id,
                  slug: product.slug,
                  name: product.name,
                  category: product.category,
                  basePrice: product.basePrice,
                  promoPrice: product.promoPrice,
                  mainImage: product.mainImage,
                }}
                variant="icon"
              />
              <Link
                href={`/commander/${product.slug || product._id}`}
                className="bg-stone-900 text-white px-6 py-3 text-xs tracking-[0.15em] uppercase font-medium hover:bg-stone-800 transition-all duration-300 whitespace-nowrap rounded-sm shadow-lg"
              >
                Commander
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Spacer for sticky CTA on mobile - LUXURY */}
      <div className="h-24 lg:hidden" />
    </main>
  );
}
