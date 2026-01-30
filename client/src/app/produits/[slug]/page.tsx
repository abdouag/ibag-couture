import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

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
    if (!res.ok) return { title: "Produit | Ibag Couture" };
    const data: ApiResponse = await res.json();
    if (!data?.data?.name) return { title: "Produit | Ibag Couture" };
    return {
      title: `${data.data.name} | Ibag Couture`,
      description: data.data.description || `Découvrez ${data.data.name}, création sur mesure par Ibag Couture.`,
    };
  } catch {
    return {
      title: "Produit | Ibag Couture",
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

  const totalWithOptions = product.options?.reduce(
    (sum, opt) => sum + opt.price,
    product.basePrice
  ) || product.basePrice;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Breadcrumb */}
      <div className="pt-20 md:pt-24 pb-4 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-stone-400">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Accueil
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/collections" className="hover:text-stone-900 transition-colors">
              Collections
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-stone-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section className="py-8 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24">

            {/* Image Gallery */}
            <ProductGallery
              mainImage={product.mainImage}
              images={product.images}
              category={product.category}
              productName={product.name}
            />

            {/* Product Info - Enhanced */}
            <div className="lg:py-4">
              <div className="sticky top-24 md:top-28 space-y-6 md:space-y-8">

                {/* Title Section */}
                <div>
                  <p className="text-amber-700 text-xs md:text-sm tracking-[0.3em] uppercase mb-2 md:mb-3 font-medium">
                    Creation sur mesure
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif text-stone-900 leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Price Section - Enhanced */}
                <div className="bg-white rounded-sm p-5 md:p-6 border border-stone-200 shadow-sm">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-stone-500 text-sm">Prix de base</span>
                    <span className="text-xs text-stone-400 tracking-wide uppercase">FCFA</span>
                  </div>
                  <p className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
                    {product.basePrice.toLocaleString('fr-FR')}
                  </p>

                  {product.options && product.options.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-stone-600 font-medium">Total avec options</span>
                        <span className="text-xl md:text-2xl font-serif text-amber-700 font-medium">
                          {totalWithOptions.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h2 className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-3 font-medium">
                      Description
                    </h2>
                    <p className="text-stone-600 leading-relaxed text-sm md:text-base">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Options - Enhanced */}
                {product.options && product.options.length > 0 && (
                  <div>
                    <h2 className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-4 font-medium">
                      Options incluses
                    </h2>
                    <div className="space-y-2">
                      {product.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 md:p-4 bg-stone-50 rounded-sm border border-stone-100 hover:border-stone-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-stone-800 text-sm md:text-base">{option.name}</span>
                          </div>
                          <span className="text-stone-500 text-sm font-medium">
                            +{option.price.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Sizes */}
                {product.availableSizes && product.availableSizes.length > 0 && (
                  <div>
                    <h2 className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-3 font-medium">
                      Tailles disponibles
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {product.availableSizes.map((size) => (
                        <span
                          key={size}
                          className="w-12 h-12 flex items-center justify-center border border-stone-200 text-stone-700 text-sm font-medium rounded-sm"
                        >
                          {size}
                        </span>
                      ))}
                      {product.isCustomAvailable && (
                        <span className="h-12 px-4 flex items-center justify-center border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium rounded-sm">
                          Sur-mesure
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Sur-mesure only (no standard sizes) */}
                {(!product.availableSizes || product.availableSizes.length === 0) && product.isCustomAvailable && (
                  <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-sm border border-amber-100">
                    <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-sm text-stone-700">
                      Ce modele est disponible uniquement <strong>sur-mesure</strong>
                      {product.customPriceImpact && product.customPriceImpact > 0
                        ? ` (+${product.customPriceImpact.toLocaleString('fr-FR')} FCFA)`
                        : ""}
                    </span>
                  </div>
                )}

                {/* Production Time */}
                {product.productionTime && (
                  <div className="flex items-center gap-3 text-stone-600 bg-amber-50 p-4 rounded-sm border border-amber-100">
                    <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      Delai de confection : <strong className="text-stone-900">{product.productionTime} jours ouvrables</strong>
                    </span>
                  </div>
                )}

                {/* CTA Button - Premium */}
                <div className="space-y-4">
                  <Link
                    href={`/commander/${product.slug || product._id}`}
                    className="group relative block w-full bg-stone-900 text-white text-center py-4 md:py-5 text-sm md:text-base tracking-[0.15em] uppercase font-medium overflow-hidden transition-all duration-500 hover:bg-stone-800 hover:shadow-lg"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Commander ce modele
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </span>
                  </Link>

                  <AddToCartButton
                    product={{
                      productId: product._id,
                      slug: product.slug,
                      name: product.name,
                      category: product.category,
                      basePrice: product.basePrice,
                      mainImage: product.mainImage,
                    }}
                  />

                  {product.isCustomAvailable && (
                    <p className="text-center text-xs md:text-sm text-stone-500">
                      Vous serez guide pour fournir vos mesures personnalisees
                    </p>
                  )}
                </div>

                {/* Trust Badges - Micro-confiance */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-stone-200">
                  <div className="text-center p-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <p className="text-[10px] md:text-xs text-stone-500 leading-tight">Paiement<br/>securise</p>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <p className="text-[10px] md:text-xs text-stone-500 leading-tight">Confection<br/>artisanale</p>
                  </div>
                  <div className="text-center p-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <p className="text-[10px] md:text-xs text-stone-500 leading-tight">Livraison<br/>estimee 7-14j</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center gap-2 text-stone-400 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <span>Des questions ? <Link href="/contact" className="text-amber-700 hover:underline">Contactez-nous</Link></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section - Enhanced */}
      <section className="py-16 md:py-20 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Notre processus</p>
            <h2 className="text-2xl md:text-3xl font-serif text-stone-900">Comment ca marche ?</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 md:gap-6">
            {[
              { step: 1, title: "Choisissez", desc: "Selectionnez votre modele et vos options personnalisees" },
              { step: 2, title: "Mesurez", desc: "Renseignez vos mesures corporelles avec notre guide" },
              { step: 3, title: "Confection", desc: "Nos artisans confectionnent votre piece unique" },
              { step: 4, title: "Livraison", desc: "Recevez votre creation directement chez vous" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-stone-900 text-white rounded-full flex items-center justify-center text-xl font-serif">
                  {item.step}
                </div>
                <h3 className="font-serif text-lg text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Measurements Guide - only for sur-mesure products */}
      {product.isCustomAvailable && <section className="py-16 bg-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-sm p-8 md:p-12 shadow-sm">
            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl text-stone-900 mb-2">Guide des mesures</h3>
              <p className="text-stone-500">Chaque piece est realisee sur mesure. Vous aurez besoin de :</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {["Tour de poitrine", "Tour de taille", "Tour de hanches", "Largeur epaules", "Longueur souhaitee"].map((measure) => (
                <div key={measure} className="flex items-center gap-2 text-sm text-stone-600">
                  <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* Contact CTA */}
      <section className="py-16 md:py-20 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">Besoin d&apos;aide ?</h2>
          <p className="text-stone-400 mb-8 leading-relaxed">
            Notre equipe est disponible pour vous accompagner dans votre commande
            et repondre a toutes vos questions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 border border-white text-white px-8 py-4 text-sm tracking-[0.15em] uppercase hover:bg-white hover:text-stone-900 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            Nous contacter
          </Link>
        </div>
      </section>

      <Footer />

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-stone-500">A partir de</p>
            <p className="text-lg font-serif text-stone-900 font-medium">
              {product.basePrice.toLocaleString('fr-FR')} <span className="text-sm text-stone-500">FCFA</span>
            </p>
          </div>
          <Link
            href={`/commander/${product.slug || product._id}`}
            className="bg-stone-900 text-white px-6 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:bg-stone-800 transition-colors"
          >
            Commander
          </Link>
        </div>
      </div>
      {/* Spacer for sticky CTA on mobile */}
      <div className="h-20 lg:hidden" />
    </main>
  );
}
