import Link from "next/link";
import { cloudinaryUrl } from "@/lib/cloudinary";

export type ProductCardData = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: string;
  mainImage?: string;
  images?: string[];
  hasStock?: boolean;
  stockQuantity?: number | null;
  promoPrice?: number | null;
  createdAt?: string;
};

type Props = {
  product: ProductCardData;
  /** Charge l'image sans attendre : pour les premieres cartes visibles */
  eager?: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  homme: "Homme",
  femme: "Femme",
  traditionnel: "Traditionnel",
  moderne: "Moderne",
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const formatPrice = (value: number) => value.toLocaleString("fr-FR");

/**
 * Un produit est « nouveau » pendant 30 jours. Les pages qui affichent les
 * cartes sont rendues a chaque requete (cache: no-store), la date de
 * reference est donc toujours celle de la visite.
 */
const isRecent = (createdAt?: string) =>
  createdAt ? Date.now() - new Date(createdAt).getTime() < THIRTY_DAYS : false;

/**
 * Carte produit, partagee par l'accueil, les collections et les produits
 * similaires. Un seul endroit pour le recadrage, les badges et le prix :
 * trois versions divergeaient, avec des regles de stock differentes et une
 * image de survol qui etait souvent la meme que l'image principale.
 */
export default function ProductCard({ product, eager = false }: Props) {
  const main = product.mainImage || product.images?.[0];
  // Au survol, la premiere photo differente de l'image principale
  const hover = product.images?.find((img) => img !== main);

  const hasPromo = product.promoPrice != null && product.promoPrice < product.basePrice;
  const isOutOfStock =
    product.hasStock === true && (product.stockQuantity == null || product.stockQuantity <= 0);
  const isLowStock =
    product.hasStock === true && product.stockQuantity != null && product.stockQuantity > 0 && product.stockQuantity < 3;
  const isNew = isRecent(product.createdAt);

  return (
    <Link href={`/produits/${product.slug || product._id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EFEDEA] mb-3">
        {main ? (
          <>
            <img
              src={cloudinaryUrl(main, { w: 600 })}
              alt={product.name}
              className="w-full h-full object-cover object-[center_12%] transition-transform duration-700 group-hover:scale-[1.03]"
              loading={eager ? "eager" : "lazy"}
            />
            {hover && (
              <img
                src={cloudinaryUrl(hover, { w: 600 })}
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

        {(hasPromo || isNew || isLowStock) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasPromo && (
              <span className="bg-[#0D0D0D] text-white text-[10px] tracking-[0.15em] uppercase px-2 py-1">
                −{Math.round((1 - product.promoPrice! / product.basePrice) * 100)} %
              </span>
            )}
            {isNew && !hasPromo && (
              <span className="bg-white text-[#0D0D0D] text-[10px] tracking-[0.15em] uppercase px-2 py-1">Nouveau</span>
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
        {hasPromo && <span className="ml-2 text-xs text-[#999] line-through">{formatPrice(product.basePrice)}</span>}
      </p>
    </Link>
  );
}
