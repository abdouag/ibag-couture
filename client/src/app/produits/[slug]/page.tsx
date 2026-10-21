import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ShareButtons from "@/components/ShareButtons";
import SimilarProducts from "@/components/SimilarProducts";
import ProductDescription from "@/components/ProductDescription";
import SizeGuideModal from "@/components/SizeGuideModal";
import HowItWorks from "@/components/HowItWorks";
import { cloudinaryUrl } from "@/lib/cloudinary";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WHATSAPP_NUMBER = "221770470928";

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

const CATEGORY_LABELS: Record<string, string> = {
  homme: "Homme",
  femme: "Femme",
  traditionnel: "Traditionnel",
  moderne: "Moderne",
};

const formatPrice = (value: number) => value.toLocaleString("fr-FR");

const whatsappLink = (productName: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Bonjour Ibag Couture, je suis intéressé(e) par le modèle « ${productName} ».`
  )}`;

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: ApiResponse = await res.json();
    return data?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product?.name) return { title: "Produit — Ibag Couture" };

  const description =
    product.description ||
    `Découvrez ${product.name}, création sur mesure par Ibag Couture. Confection artisanale, haute couture africaine.`;
  const ogImage = cloudinaryUrl(product.mainImage || product.images?.[0], { w: 1200 }) || undefined;

  return {
    title: `${product.name} — Création Sur Mesure`,
    description,
    alternates: { canonical: `/produits/${slug}` },
    openGraph: {
      title: `${product.name} | Ibag Couture`,
      description,
      url: `/produits/${slug}`,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, alt: `${product.name} — Ibag Couture` }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Ibag Couture`,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  // Un produit desactive ne doit pas etre accessible par lien direct : il
  // s'agit soit d'un brouillon, soit d'un article retire de la vente.
  if (!product || product.isActive === false) {
    notFound();
  }

  const hasPromo = product.promoPrice != null && product.promoPrice < product.basePrice;
  const displayPrice = hasPromo ? product.promoPrice! : product.basePrice;
  const discount = hasPromo ? Math.round((1 - product.promoPrice! / product.basePrice) * 100) : 0;
  const isOutOfStock = product.hasStock && (product.stockQuantity == null || product.stockQuantity <= 0);
  const sizes = product.availableSizes || [];
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;
  const orderHref = `/commander/${product.slug || product._id}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com";
  const ogImage = cloudinaryUrl(product.mainImage || product.images?.[0], { w: 1200 }) || undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name}, création sur mesure par Ibag Couture.`,
    ...(ogImage && { image: ogImage }),
    brand: { "@type": "Brand", name: "Ibag Couture" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produits/${product.slug}`,
      priceCurrency: "XOF",
      price: displayPrice,
      availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    category: product.category,
  };

  const cartProduct = {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    basePrice: product.basePrice,
    promoPrice: product.promoPrice,
    mainImage: product.mainImage,
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Fil d'ariane — desktop uniquement : sur mobile il repousse la photo sous le pli */}
      <nav
        aria-label="Fil d'ariane"
        className="hidden lg:block max-w-7xl mx-auto px-8 pt-6 text-[11px] tracking-[0.15em] uppercase text-[#999]"
      >
        <Link href="/" className="hover:text-[#0D0D0D] transition-colors">Accueil</Link>
        <span className="mx-3">/</span>
        <Link href="/collections" className="hover:text-[#0D0D0D] transition-colors">Collections</Link>
        <span className="mx-3">/</span>
        <Link href={`/collections?category=${product.category}`} className="hover:text-[#0D0D0D] transition-colors">
          {categoryLabel}
        </Link>
      </nav>

      <section className="max-w-7xl mx-auto lg:px-8 lg:pt-6 lg:pb-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* Galerie : bord a bord sur mobile, collante sur desktop */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery mainImage={product.mainImage} images={product.images} productName={product.name} />
          </div>

          {/* Informations */}
          <div className="px-5 pt-6 pb-10 sm:px-8 lg:px-0 lg:pt-2 space-y-8 lg:space-y-10">
            <header>
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A45C] mb-3">
                {categoryLabel}
                {product.isCustomAvailable && <span className="text-[#999]"> · Sur mesure</span>}
              </p>
              <h1 className="font-luxury text-[28px] leading-[1.15] sm:text-4xl lg:text-[44px] text-[#0D0D0D] mb-4">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 flex-wrap">
                <p className="text-2xl lg:text-[28px] text-[#0D0D0D] tabular-nums">
                  {formatPrice(displayPrice)} <span className="text-sm text-[#999]">FCFA</span>
                </p>
                {hasPromo && (
                  <>
                    <p className="text-base text-[#999] line-through tabular-nums">{formatPrice(product.basePrice)}</p>
                    <span className="text-[11px] tracking-wider uppercase text-[#C9A45C]">−{discount} %</span>
                  </>
                )}
              </div>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#666]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                  Livraison Dakar 48h
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                  Retouches incluses
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#C9A45C]" aria-hidden="true" />
                  Acompte, solde à la livraison
                </li>
              </ul>
            </header>

            {/* Tailles */}
            {(sizes.length > 0 || product.isCustomAvailable) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[11px] tracking-[0.3em] uppercase text-[#999]">Tailles</h2>
                  <SizeGuideModal availableSizes={sizes} isCustomAvailable={product.isCustomAvailable} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="min-w-[48px] h-12 px-3 inline-flex items-center justify-center border border-[#E8E4E0] text-sm text-[#0D0D0D]"
                    >
                      {size}
                    </span>
                  ))}
                  {product.isCustomAvailable && (
                    <span className="h-12 px-4 inline-flex items-center justify-center border border-[#C9A45C] text-sm text-[#0D0D0D]">
                      Sur mesure
                      {product.customPriceImpact && product.customPriceImpact > 0 ? (
                        <span className="ml-2 text-[#999]">+{formatPrice(product.customPriceImpact)} F</span>
                      ) : null}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[13px] text-[#999]">
                  {product.isCustomAvailable
                    ? "La taille, ou vos mesures, se choisissent à l'étape suivante."
                    : "La taille se choisit à l'étape suivante."}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {isOutOfStock ? (
                <div className="w-full py-4 text-center text-[11px] tracking-[0.2em] uppercase bg-[#E8E4E0] text-[#999]">
                  Indisponible
                </div>
              ) : (
                <>
                  <Link
                    href={orderHref}
                    className="flex items-center justify-center w-full py-4 bg-[#0D0D0D] text-white text-[12px] tracking-[0.2em] uppercase hover:bg-[#262626] transition-colors"
                  >
                    Commander ce modèle
                  </Link>
                  <a
                    href={whatsappLink(product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 border border-[#25D366] text-[#128C4A] text-[12px] tracking-[0.2em] uppercase hover:bg-[#25D366]/10 transition-colors"
                  >
                    <WhatsAppIcon />
                    Poser une question
                  </a>
                  <div className="hidden lg:block">
                    <AddToCartButton product={cartProduct} />
                  </div>
                </>
              )}
            </div>

            <HowItWorks productionTime={product.productionTime} isCustomAvailable={product.isCustomAvailable} />

            {/* Details */}
            <div className="space-y-6">
              {product.description && <ProductDescription description={product.description} />}

              {product.options && product.options.length > 0 && (
                <div>
                  <h2 className="text-[11px] tracking-[0.3em] uppercase text-[#999] mb-3">
                    Personnalisations possibles
                  </h2>
                  <ul className="divide-y divide-[#E8E4E0] border-y border-[#E8E4E0]">
                    {product.options.map((option) => (
                      <li key={option.name} className="flex items-center justify-between py-3 text-sm">
                        <span className="text-[#0D0D0D]">{option.name}</span>
                        <span className="text-[#666] tabular-nums">+{formatPrice(option.price)} FCFA</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ShareButtons productName={product.name} slug={product.slug} />
            </div>
          </div>
        </div>
      </section>

      <SimilarProducts category={product.category} currentProductId={product._id} />

      <Footer />

      {/* Barre d'action fixe — mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white/95 backdrop-blur-sm border-t border-[#E8E4E0] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[17px] text-[#0D0D0D] tabular-nums">
              {formatPrice(displayPrice)} <span className="text-xs text-[#999]">FCFA</span>
            </p>
            {hasPromo && (
              <p className="text-xs text-[#999] line-through tabular-nums">{formatPrice(product.basePrice)}</p>
            )}
          </div>
          {isOutOfStock ? (
            <span className="px-5 py-3 text-[11px] tracking-[0.15em] uppercase bg-[#E8E4E0] text-[#999]">Indisponible</span>
          ) : (
            <>
              <a
                href={whatsappLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Poser une question sur WhatsApp"
                className="flex items-center justify-center w-12 h-12 border border-[#25D366] text-[#128C4A]"
              >
                <WhatsAppIcon className="w-6 h-6" />
              </a>
              <Link
                href={orderHref}
                className="flex-1 max-w-[200px] flex items-center justify-center h-12 bg-[#0D0D0D] text-white text-[11px] tracking-[0.2em] uppercase"
              >
                Commander
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </main>
  );
}
