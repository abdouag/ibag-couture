import Link from "next/link";
import Footer from "@/components/Footer";
import HeroDynamicGallery from "@/components/HeroDynamicGallery";
import { cloudinaryUrl } from "@/lib/cloudinary";
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
const WHATSAPP_ORDER_URL =
  "https://wa.me/221770470928?text=" +
  encodeURIComponent("Bonjour Ibag Couture, je souhaite commander sur mesure.");

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
  createdAt?: string;
};

type ApiResponse = {
  success: boolean;
  data: Product[];
};

const CATEGORIES = [
  { slug: "homme", label: "Homme" },
  { slug: "femme", label: "Femme" },
  { slug: "traditionnel", label: "Traditionnel" },
  { slug: "moderne", label: "Moderne" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.label])
);

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const formatPrice = (value: number) => value.toLocaleString("fr-FR");

const firstImage = (product: Product) =>
  product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : undefined);

/**
 * Repartit les produits pour alterner les categories dans la grille.
 */
const pickDiverse = (items: Product[], count: number): Product[] => {
  if (items.length <= count) return items;
  const result: Product[] = [];
  const pool = [...items.slice(0, count * 2)];
  const seen: Record<string, number> = {};

  while (result.length < count && pool.length > 0) {
    let bestIdx = 0;
    let bestCount = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const current = seen[pool[i].category] || 0;
      if (current < bestCount) {
        bestCount = current;
        bestIdx = i;
      }
    }
    const picked = pool.splice(bestIdx, 1)[0];
    seen[picked.category] = (seen[picked.category] || 0) + 1;
    result.push(picked);
  }
  return result;
};

export default async function Home() {
  let products: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/products?limit=200&isActive=true`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      products = data?.data || [];
    }
  } catch {
    // API indisponible : la page s'affiche sans produits
  }

  const inStock = products.filter((p) => p.hasStock !== false && p.hasStock !== null);
  const featured = pickDiverse(inStock.length >= 8 ? inStock : products, 8);

  // Le hero reprend les premiers produits du tri intelligent de l'API
  // (meilleures ventes, promotions, nouveautes), dans cet ordre : pas de
  // tirage au sort, pour que le serveur et le navigateur affichent la meme
  // premiere photo, et que la plus vendeuse passe en premier.
  const heroImages = products
    .filter((p) => firstImage(p))
    .slice(0, 6)
    .map((p) => ({ url: cloudinaryUrl(firstImage(p), { w: 1400 }), alt: p.name }));

  const categories = CATEGORIES.map((cat) => {
    const inCategory = products.filter((p) => p.category.toLowerCase() === cat.slug);
    const withImage = inCategory.find((p) => firstImage(p));
    return { ...cat, count: inCategory.length, image: withImage ? firstImage(withImage) : undefined };
  });

  const now = Date.now();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "Ibag Couture",
    description:
      "Maison de haute couture africaine sur mesure. Robes, costumes et tenues traditionnelles confectionnés artisanalement.",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    priceRange: "$$",
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Couture sur mesure",
        description:
          "Confection artisanale de vêtements sur mesure alliant traditions africaines et élégance contemporaine.",
      },
    },
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ═══════════════ HERO ═══════════════ */}
      {/* Mobile : la photo en fond, le texte par-dessus. Desktop : composition
          editoriale, texte a gauche sur fond noir, photo en colonne portrait a
          droite. Un portrait en pied etire sur toute la largeur d'un ecran ne
          montrait plus que le visage : le vetement disparaissait. */}
      <section className="relative bg-[#0D0D0D] overflow-hidden lg:grid lg:grid-cols-2 lg:min-h-[88vh]">
        <div className="absolute inset-0 lg:relative lg:inset-auto lg:order-2 lg:min-h-[88vh]">
          <HeroDynamicGallery images={heroImages} fallbackImage="/images/IMG_1991.PNG" interval={7000} />
        </div>

        <div className="relative z-20 min-h-[78vh] md:min-h-[88vh] lg:min-h-0 flex items-end lg:items-center lg:order-1">
          <div className="w-full px-5 sm:px-8 lg:px-16 xl:px-24 pb-14 md:pb-24 lg:py-24">
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#C9A45C] mb-4">Ibag Couture — Dakar</p>
            <h1 className="font-luxury text-[34px] leading-[1.08] sm:text-5xl lg:text-[56px] xl:text-[68px] text-white font-light mb-4 max-w-3xl">
              Costumes &amp; tenues africaines,
              <br />
              <em>sur mesure.</em>
            </h1>
            <p className="text-white/70 text-[15px] md:text-lg mb-8 max-w-xl">
              Confectionnés à la main dans notre atelier de Dakar. Livrés en 48h.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/collections" className="btn-luxury-gold">
                Découvrir la collection
              </Link>
              <a href={WHATSAPP_ORDER_URL} target="_blank" rel="noopener noreferrer" className="btn-luxury-outline">
                Commander sur mesure
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CRÉATIONS PHARES ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A45C] mb-2">Nos créations</p>
              <h2 className="font-luxury text-3xl md:text-4xl text-[#0D0D0D]">Pièces phares</h2>
            </div>
            <Link
              href="/collections"
              className="hidden sm:inline-block text-[11px] tracking-[0.2em] uppercase text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A45C] hover:border-[#C9A45C] transition-colors"
            >
              Tout voir
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-center text-[#999] py-16 md:py-20">Nos collections arrivent bientôt…</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-8">
              {featured.map((product) => {
                const main = firstImage(product);
                const second = product.images && product.images.length > 1 ? product.images[1] : undefined;
                const hasPromo = product.promoPrice != null && product.promoPrice < product.basePrice;
                const isOutOfStock =
                  product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0);
                const isLowStock =
                  product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity < 3;
                const isNew = product.createdAt ? now - new Date(product.createdAt).getTime() < THIRTY_DAYS : false;

                return (
                  <Link key={product._id} href={`/produits/${product.slug || product._id}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#EFEDEA] mb-3">
                      {main ? (
                        <>
                          <img
                            src={cloudinaryUrl(main, { w: 600 })}
                            alt={product.name}
                            className="w-full h-full object-cover object-[center_12%] transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          {second && (
                            <img
                              src={cloudinaryUrl(second, { w: 600 })}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover object-[center_12%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
                              loading="lazy"
                            />
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#B5AFA8] text-xs tracking-[0.2em] uppercase">
                          Photo à venir
                        </div>
                      )}

                      {(isNew || hasPromo || isLowStock) && (
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {hasPromo && (
                            <span className="bg-[#0D0D0D] text-white text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                              −{Math.round((1 - product.promoPrice! / product.basePrice) * 100)} %
                            </span>
                          )}
                          {isNew && !hasPromo && (
                            <span className="bg-white text-[#0D0D0D] text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                              Nouveau
                            </span>
                          )}
                          {isLowStock && (
                            <span className="bg-[#C9A45C] text-[#0D0D0D] text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                              Dernières pièces
                            </span>
                          )}
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="text-[11px] tracking-[0.2em] uppercase text-[#0D0D0D]">Épuisé</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#999] mb-1">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </p>
                    <h3 className="font-luxury text-[15px] md:text-base text-[#0D0D0D] leading-snug line-clamp-2 mb-1.5 group-hover:text-[#C9A45C] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#0D0D0D] tabular-nums">
                      {formatPrice(hasPromo ? product.promoPrice! : product.basePrice)}
                      <span className="text-xs text-[#999]"> FCFA</span>
                      {hasPromo && (
                        <span className="ml-2 text-xs text-[#999] line-through">{formatPrice(product.basePrice)}</span>
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link href="/collections" className="btn-luxury-primary">
              Voir toutes les créations
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CATÉGORIES ═══════════════ */}
      <section className="pb-16 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A45C] mb-2">Explorer</p>
          <h2 className="font-luxury text-3xl md:text-4xl text-[#0D0D0D] mb-8 md:mb-12">Nos univers</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections?category=${cat.slug}`}
                className="group relative aspect-[4/5] overflow-hidden bg-[#0D0D0D]"
              >
                {cat.image && (
                  <img
                    src={cloudinaryUrl(cat.image, { w: 700 })}
                    alt={cat.label}
                    className="w-full h-full object-cover object-[center_12%] opacity-90 transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h3 className="font-luxury text-xl md:text-2xl text-white">{cat.label}</h3>
                  {cat.count > 0 && (
                    <p className="text-white/60 text-[11px] tracking-[0.15em] uppercase mt-1">
                      {cat.count} {cat.count > 1 ? "modèles" : "modèle"}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ RÉASSURANCE ═══════════════ */}
      <section className="py-8 md:py-10 bg-[#0D0D0D] text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-14 text-[12px] md:text-[13px] tracking-[0.12em] uppercase text-white/70">
            {["Livraison Dakar 48h", "Retouches incluses", "Acompte, solde à la livraison", "Assistance WhatsApp"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <h2 className="font-luxury text-3xl sm:text-4xl md:text-5xl text-[#0D0D0D] mb-5 leading-tight">
            Prêt à créer un vêtement
            <br />
            <em className="font-light">qui vous ressemble ?</em>
          </h2>
          <p className="text-[#666] mb-10 text-[15px] md:text-lg leading-relaxed max-w-xl mx-auto">
            Parcourez nos collections, ou écrivez-nous : on vous guide pour vos mesures.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/collections" className="btn-luxury-primary">
              Découvrir la collection
            </Link>
            <a
              href={WHATSAPP_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-[#25D366] text-[#128C4A] px-8 py-3.5 text-[11px] tracking-[0.15em] uppercase hover:bg-[#25D366]/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
