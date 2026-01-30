import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

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
};

type ApiResponse = {
  success: boolean;
  data: Product[];
};

export default async function Home() {
  let products: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/products`, {
      cache: "no-store",
    });
    const data: ApiResponse = await res.json();
    products = data.data || [];
  } catch {
    // API not available (build time or server down) — render empty
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-amber-700 text-sm tracking-[0.3em] uppercase mb-6 font-medium">
            Maison de Couture
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-stone-900 leading-tight mb-8">
            La couture sur mesure,
            <br />
            <span className="italic font-light">pensée pour vous</span>
          </h1>
          <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Découvrez l&apos;excellence de la haute couture africaine.
            Chaque pièce est confectionnée à la main, selon vos mesures exactes,
            pour sublimer votre élégance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#collections"
              className="inline-block bg-stone-900 text-white px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-800 hover:shadow-lg transition-all duration-300"
            >
              Voir nos créations
            </a>
            <a
              href="#apropos"
              className="inline-block border border-stone-400 text-stone-700 px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-100 transition-all duration-300"
            >
              Notre histoire
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="apropos" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Text - Desktop: left, Mobile: below image */}
            <div className="order-2 md:order-1">
              <p className="text-amber-700 text-sm tracking-[0.3em] uppercase mb-4">
                Notre Histoire
              </p>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-6">
                L&apos;art de la couture
                <br />
                <span className="italic font-light">réinventé</span>
              </h2>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  Ibag Couture naît de la passion pour l&apos;élégance et le raffinement.
                  Notre maison perpétue les traditions de la haute couture africaine
                  tout en embrassant la modernité.
                </p>
                <p>
                  Chaque création est le fruit d&apos;un savoir-faire artisanal transmis
                  de génération en génération, allié aux techniques les plus contemporaines.
                </p>
              </div>
              <div className="mt-10 flex gap-12">
                <div>
                  <p className="text-4xl font-serif text-stone-900">150+</p>
                  <p className="text-sm text-stone-500 tracking-wide">Créations uniques</p>
                </div>
                <div>
                  <p className="text-4xl font-serif text-stone-900">100%</p>
                  <p className="text-sm text-stone-500 tracking-wide">Sur mesure</p>
                </div>
              </div>
            </div>
            {/* Image - Desktop: right, Mobile: above text */}
            <div className="relative order-1 md:order-2">
              <div className="aspect-[4/5] relative rounded-sm overflow-hidden shadow-xl">
                <Image
                  src="/images/IMG_1991.PNG"
                  alt="L'art de la couture Ibag - Notre savoir-faire"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-amber-600/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-24 md:py-32 bg-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-amber-700 text-sm tracking-[0.3em] uppercase mb-4">
              Nos Créations
            </p>
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900">
              Collections en vedette
            </h2>
          </div>

          {products.length === 0 ? (
            <p className="text-center text-stone-500">
              Nos collections arrivent bientôt...
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="group bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                >
                  <Link href={`/produits/${product.slug || product._id}`}>
                    <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden">
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
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                        <span className="bg-stone-900/90 text-white text-[10px] sm:text-xs tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1">
                          {product.category}
                        </span>
                      </div>
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-500 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-stone-900 px-4 sm:px-6 py-2 text-xs sm:text-sm tracking-wide">
                          Voir le modèle
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-3 sm:p-6">
                    <Link href={`/produits/${product.slug || product._id}`}>
                      <h3 className="font-serif text-sm sm:text-xl text-stone-900 mb-1 sm:mb-2 group-hover:text-amber-700 transition-colors line-clamp-1 sm:line-clamp-none">
                        {product.name}
                      </h3>
                    </Link>
                    {product.description && (
                      <p className="text-stone-500 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 hidden sm:block">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-stone-900 text-xs sm:text-base">
                        <span className="hidden sm:inline text-sm text-stone-500">À partir de </span>
                        <span className="font-medium">{product.basePrice.toLocaleString('fr-FR')}</span>
                        <span className="text-xs sm:text-sm text-stone-500"> FCFA</span>
                      </p>
                      <Link
                        href={`/produits/${product.slug || product._id}`}
                        className="text-amber-700 text-xs sm:text-sm tracking-wide hover:text-amber-800 transition-colors hidden sm:inline"
                      >
                        Découvrir →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/collections"
              className="inline-block border border-stone-900 text-stone-900 px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-300"
            >
              Voir toutes les collections
            </Link>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-24 md:py-32 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4">
              Pourquoi nous choisir
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">
              L&apos;excellence à chaque étape
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
            {/* Sur Mesure */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-amber-500/50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Sur Mesure</h3>
              <p className="text-stone-400 leading-relaxed">
                Chaque vêtement est confectionné selon vos mesures exactes
                pour un ajustement parfait.
              </p>
            </div>

            {/* Qualité Premium */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-amber-500/50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Qualité Premium</h3>
              <p className="text-stone-400 leading-relaxed">
                Des tissus nobles et des finitions impeccables
                pour des pièces qui traversent le temps.
              </p>
            </div>

            {/* Livraison */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-amber-500/50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Livraison Soignée</h3>
              <p className="text-stone-400 leading-relaxed">
                Votre commande livrée dans un écrin,
                prête à être portée pour vos moments précieux.
              </p>
            </div>

            {/* Satisfaction Garantie */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-amber-500/50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl mb-3">Satisfaction Garantie</h3>
              <p className="text-stone-400 leading-relaxed">
                Retouches incluses et suivi personnalisé
                pour une satisfaction totale à chaque commande.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-amber-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-6">
            Prêt à créer votre pièce unique ?
          </h2>
          <p className="text-stone-600 mb-10 leading-relaxed">
            Parlons de votre projet. Nos artisans sont à votre écoute
            pour donner vie à vos envies.
          </p>
          <Link
            href="/collections"
            className="inline-block bg-stone-900 text-white px-12 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-800 hover:shadow-lg transition-all duration-300"
          >
            Parcourir nos créations
          </Link>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
