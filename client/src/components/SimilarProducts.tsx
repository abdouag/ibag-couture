import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: string;
  mainImage?: string;
  images?: string[];
  promoPrice?: number | null;
};

type ApiResponse = {
  success: boolean;
  data: Product[];
};

type Props = {
  category: string;
  currentProductId: string;
};

export default async function SimilarProducts({ category, currentProductId }: Props) {
  let products: Product[] = [];

  try {
    const res = await fetch(`${API_URL}/api/products?category=${encodeURIComponent(category)}&limit=20`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      products = (data?.data || [])
        .filter((p) => p._id !== currentProductId)
        .slice(0, 4);
    }
  } catch {
    // API unavailable
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-white border-t border-[#E8E4E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-[#C9A45C] text-xs tracking-[0.3em] uppercase mb-2 font-medium">
            Vous aimerez aussi
          </p>
          <h2 className="text-2xl md:text-3xl font-serif text-[#0D0D0D]">
            Produits similaires
          </h2>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {products.map((product) => {
            const imgUrl = product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : null);
            const imgSrc = imgUrl
              ? imgUrl.startsWith("http") ? imgUrl : `${API_URL}${imgUrl}`
              : null;
            const hasPromo = product.promoPrice != null && product.promoPrice < product.basePrice;

            return (
              <Link
                key={product._id}
                href={`/produits/${product.slug || product._id}`}
                className="group flex-shrink-0 w-[65%] sm:w-[48%] lg:w-auto snap-start"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden mb-3">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {hasPromo && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                      <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1">
                        -{Math.round((1 - product.promoPrice! / product.basePrice) * 100)}%
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white text-[#0D0D0D] px-5 py-2 text-sm tracking-wide">
                      Voir le mod&egrave;le
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#C9A45C] uppercase tracking-wider mb-1">{product.category}</p>
                  <h3 className="font-serif text-sm sm:text-base text-[#0D0D0D] group-hover:text-[#C9A45C] transition-colors line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  {hasPromo ? (
                    <p className="text-sm">
                      <span className="font-medium text-red-700">{product.promoPrice!.toLocaleString("fr-FR")}</span>
                      <span className="text-xs text-stone-500"> FCFA</span>
                      <span className="ml-1.5 text-stone-400 line-through text-xs">{product.basePrice.toLocaleString("fr-FR")}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-[#0D0D0D]">
                      <span className="font-medium">{product.basePrice.toLocaleString("fr-FR")}</span>
                      <span className="text-xs text-stone-500"> FCFA</span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
