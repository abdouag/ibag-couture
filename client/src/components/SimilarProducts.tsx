import ProductCard, { type ProductCardData } from "@/components/ProductCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ApiResponse = {
  success: boolean;
  data: ProductCardData[];
};

type Props = {
  category: string;
  currentProductId: string;
};

export default async function SimilarProducts({ category, currentProductId }: Props) {
  let products: ProductCardData[] = [];

  try {
    const res = await fetch(
      `${API_URL}/api/products?category=${encodeURIComponent(category)}&limit=20&isActive=true`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data: ApiResponse = await res.json();
      products = (data?.data || []).filter((p) => p._id !== currentProductId).slice(0, 4);
    }
  } catch {
    // API indisponible : la section n'est simplement pas affichee
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 border-t border-[#E8E4E0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A45C] mb-2">Vous aimerez aussi</p>
        <h2 className="font-luxury text-2xl md:text-3xl text-[#0D0D0D] mb-8">Dans le même esprit</h2>

        {/* Mobile : defilement horizontal avec accroche ; desktop : grille */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:gap-8 lg:overflow-visible lg:pb-0">
          {products.map((product) => (
            <div key={product._id} className="flex-shrink-0 w-[62%] sm:w-[45%] lg:w-auto snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
