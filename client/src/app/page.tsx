import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
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
    if (res.ok) {
      const data: ApiResponse = await res.json();
      products = data?.data || [];
    }
  } catch {
    // API not available (build time or server down) — render empty
  }

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
      {/* Hero Section */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center justify-center pt-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <p className="text-amber-700 text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Maison de Couture
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-stone-900 leading-tight mb-5 md:mb-6">
            La couture sur mesure,
            <br />
            <span className="italic font-light">pensée pour vous</span>
          </h1>
          <p className="text-stone-600 text-base md:text-lg max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Découvrez l&apos;excellence de la haute couture africaine.
            Chaque pièce est confectionnée à la main, selon vos mesures exactes,
            pour sublimer votre élégance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#collections"
              className="inline-block bg-stone-900 text-white px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-stone-800 hover:shadow-lg transition-all duration-300 font-medium"
            >
              Voir nos créations
            </a>
            <a
              href="#apropos"
              className="inline-block border border-stone-400 text-stone-700 px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-stone-100 transition-all duration-300"
            >
              Notre histoire
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* About Section — Notre Histoire */}
      <section id="apropos" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center">
            {/* Text */}
            <ScrollReveal className="order-2 md:order-1" direction="left">
              <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-5 font-medium">
                Notre Maison
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-stone-900 mb-8 leading-[1.15]">
                Là où le tissu
                <br />
                <span className="italic font-light">rencontre l&apos;âme</span>
              </h2>
              <div className="space-y-5 text-stone-600 leading-relaxed text-[15px] md:text-base">
                <p>
                  Chez Ibag Couture, chaque vêtement commence par une écoute.
                  Celle de vos envies, de votre silhouette, de l&apos;occasion
                  qui vous attend. Nous ne fabriquons pas du prêt-à-porter —
                  nous façonnons des pièces qui vous ressemblent.
                </p>
                <p>
                  Nos mains d&apos;artisans tracent, coupent et assemblent avec
                  la même exigence depuis le premier jour : celle du geste juste,
                  du détail qui fait la différence, du tissu choisi avec soin.
                </p>
              </div>
              <div className="mt-10 flex gap-10 sm:gap-14">
                <div>
                  <p className="text-4xl md:text-5xl font-serif text-stone-900">150+</p>
                  <p className="text-xs sm:text-sm text-stone-500 tracking-wide mt-1">Créations uniques</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl font-serif text-stone-900">100%</p>
                  <p className="text-xs sm:text-sm text-stone-500 tracking-wide mt-1">Sur mesure</p>
                </div>
              </div>
              <div className="mt-10">
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 text-sm text-stone-900 tracking-[0.15em] uppercase border-b border-stone-900 pb-1 hover:text-amber-700 hover:border-amber-700 transition-colors duration-300"
                >
                  Découvrir nos créations
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            {/* Image */}
            <ScrollReveal className="relative order-1 md:order-2" direction="right">
              <div className="aspect-[4/5] relative rounded-sm overflow-hidden shadow-2xl">
                <Image
                  src="/images/IMG_1991.PNG"
                  alt="Artisan Ibag Couture travaillant le tissu dans l'atelier"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 w-24 h-24 md:w-32 md:h-32 border border-amber-600/20" />
              <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-20 h-20 md:w-28 md:h-28 border border-stone-300/30" />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Notre Philosophie — 3 Pillars */}
      <section className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <ScrollReveal className="text-center mb-14 md:mb-20">
            <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              Notre Philosophie
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 max-w-xl mx-auto leading-snug">
              Trois engagements,
              <br />
              <span className="italic font-light">une même exigence</span>
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Pillar 1: Le Geste */}
            <ScrollReveal delay={0}>
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-700/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925v2.925m0-2.925a1.575 1.575 0 013.15 0v2.925m-3.15 0l.075 3m0 0a.75.75 0 01-.75.75H6.57a2.25 2.25 0 01-2.186-1.72L3.91 11.08a1.575 1.575 0 011.088-1.894l.394-.1m7.658 5.914l.6-3m-7.658-2.006L4.26 9.527A1.125 1.125 0 003.5 10.6v.15" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-3">Le Geste</h3>
                <div className="w-8 h-px bg-amber-700/40 mx-auto mb-4" />
                <p className="text-stone-500 leading-relaxed text-[15px]">
                  Chaque couture est posée à la main. Pas de raccourci,
                  pas de série. Un geste précis, répété avec patience,
                  parce que c&apos;est dans le détail que naît la qualité.
                </p>
              </div>
            </ScrollReveal>

            {/* Pillar 2: La Mesure */}
            <ScrollReveal delay={150}>
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-700/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-3">La Mesure</h3>
                <div className="w-8 h-px bg-amber-700/40 mx-auto mb-4" />
                <p className="text-stone-500 leading-relaxed text-[15px]">
                  Votre corps est unique, votre vêtement doit l&apos;être aussi.
                  Nous prenons vos mesures avec rigueur pour un tombé
                  qui épouse votre silhouette sans compromis.
                </p>
              </div>
            </ScrollReveal>

            {/* Pillar 3: Le Tissu */}
            <ScrollReveal delay={300}>
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-700/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-3">Le Tissu</h3>
                <div className="w-8 h-px bg-amber-700/40 mx-auto mb-4" />
                <p className="text-stone-500 leading-relaxed text-[15px]">
                  Bazin, wax, lin, soie — nous sélectionnons chaque étoffe
                  pour sa tenue, son éclat et sa noblesse. Un bon vêtement
                  commence toujours par un bon tissu.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Dans Notre Atelier */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <ScrollReveal className="text-center">
            <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              Dans Notre Atelier
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 mb-8 leading-snug">
              Du croquis à la dernière couture
            </h2>
            <div className="max-w-2xl mx-auto space-y-5 text-stone-600 leading-relaxed text-[15px] md:text-base">
              <p>
                Tout commence par un échange. Vous nous parlez de l&apos;événement,
                du style que vous aimez, des couleurs qui vous inspirent.
                Puis nos artisans dessinent, ajustent et confectionnent —
                pièce par pièce, à votre rythme.
              </p>
              <p>
                Entre le premier coup de ciseau et l&apos;essayage final,
                chaque étape est pensée pour que le résultat soit à la hauteur
                de vos attentes. Pas de production en masse, pas de standardisation :
                juste un vêtement fait pour vous, avec le temps qu&apos;il mérite.
              </p>
            </div>
          </ScrollReveal>

          {/* Process Steps */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <ScrollReveal delay={0}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-sm font-serif text-stone-900">01</span>
                </div>
                <p className="text-sm font-medium text-stone-900 mb-1">Écoute</p>
                <p className="text-xs text-stone-500 leading-relaxed">Vos envies, votre style, votre occasion</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-sm font-serif text-stone-900">02</span>
                </div>
                <p className="text-sm font-medium text-stone-900 mb-1">Mesures</p>
                <p className="text-xs text-stone-500 leading-relaxed">Prise de mesures précise et rigoureuse</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-sm font-serif text-stone-900">03</span>
                </div>
                <p className="text-sm font-medium text-stone-900 mb-1">Confection</p>
                <p className="text-xs text-stone-500 leading-relaxed">Coupe, assemblage et finitions à la main</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-sm font-serif text-stone-900">04</span>
                </div>
                <p className="text-sm font-medium text-stone-900 mb-1">Livraison</p>
                <p className="text-xs text-stone-500 leading-relaxed">Votre pièce livrée avec soin, prête à porter</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-16 md:py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-amber-700 text-xs sm:text-sm tracking-[0.3em] uppercase mb-3">
              Nos Créations
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900">
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

          <div className="text-center mt-10">
            <Link
              href="/collections"
              className="inline-block border border-stone-900 text-stone-900 px-10 py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-white transition-all duration-300"
            >
              Voir toutes les collections
            </Link>
          </div>
        </div>
      </section>

      {/* Pourquoi Ibag Couture */}
      <section className="py-20 md:py-28 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <ScrollReveal className="text-center mb-14 md:mb-20">
            <p className="text-amber-400/90 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              Pourquoi nous choisir
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif leading-snug">
              L&apos;excellence à chaque étape
            </h2>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
            <ScrollReveal delay={0}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 border border-amber-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg mb-2">Sur Mesure</h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Confectionné selon vos mesures exactes,
                  pour un ajustement qui vous est propre.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 border border-amber-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg mb-2">Qualité Premium</h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Tissus nobles et finitions impeccables
                  pour des pièces qui traversent le temps.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 border border-amber-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg mb-2">Livraison Soignée</h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Votre commande livrée dans un écrin,
                  prête à être portée pour vos moments précieux.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 border border-amber-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg mb-2">Satisfaction Garantie</h3>
                <p className="text-stone-400 leading-relaxed text-sm">
                  Retouches incluses et suivi personnalisé
                  pour une satisfaction totale.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 md:py-28 bg-amber-50/60">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
            <p className="text-amber-700 text-xs tracking-[0.3em] uppercase mb-4 font-medium">
              Votre prochaine pièce
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-stone-900 mb-5 leading-snug">
              Prêt à créer un vêtement
              <br />
              <span className="italic font-light">qui vous ressemble ?</span>
            </h2>
            <p className="text-stone-600 mb-10 leading-relaxed max-w-lg mx-auto">
              Parcourez nos collections ou contactez-nous directement.
              Nos artisans sont à votre écoute pour donner vie à vos envies.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/collections"
                className="inline-block bg-stone-900 text-white px-10 py-4 text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-stone-800 hover:shadow-lg transition-all duration-300 font-medium"
              >
                Découvrir la collection
              </Link>
              <a
                href="#contact"
                className="inline-block border border-stone-400 text-stone-700 px-10 py-4 text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-stone-100 transition-all duration-300"
              >
                Commander sur mesure
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer variant="full" />
    </main>
  );
}
