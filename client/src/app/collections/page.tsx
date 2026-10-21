import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/Footer";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WHATSAPP_CUSTOM_URL =
  "https://wa.me/221770470928?text=" +
  encodeURIComponent("Bonjour Ibag Couture, je souhaite une création personnalisée.");

type Product = ProductCardData;

type ApiResponse = {
  success: boolean;
  data: Product[];
  total: number;
};

export const metadata = {
  title: "Collections — Haute Couture Africaine",
  description:
    "Explorez nos collections de haute couture africaine sur mesure : robes, costumes, tenues traditionnelles et modernes. Confection artisanale selon vos mesures.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Collections | Ibag Couture",
    description:
      "Robes, costumes et créations sur mesure alliant traditions africaines et élégance contemporaine. Parcourez nos collections homme, femme, traditionnel et moderne.",
    url: "/collections",
  },
};

type Props = {
  searchParams: Promise<{ category?: string }>;
};

const CATEGORY_TITLES: Record<string, string> = {
  tous: "Toutes nos créations",
  homme: "Homme",
  femme: "Femme",
  traditionnel: "Traditionnel",
  moderne: "Moderne",
};

/**
 * Alterne les categories pour eviter les blocs de pieces semblables.
 */
const diversify = (items: Product[]): Product[] => {
  if (items.length <= 1) return items;
  const result: Product[] = [];
  const remaining = [...items];
  const seen: Record<string, number> = {};

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestCount = Infinity;
    const lookAhead = Math.min(remaining.length, 8);
    for (let i = 0; i < lookAhead; i++) {
      const cat = remaining[i].category?.toLowerCase() || "";
      const count = seen[cat] || 0;
      if (count < bestCount) {
        bestCount = count;
        bestIdx = i;
      }
    }
    const picked = remaining.splice(bestIdx, 1)[0];
    const cat = picked.category?.toLowerCase() || "";
    seen[cat] = (seen[cat] || 0) + 1;
    result.push(picked);
  }
  return result;
};

/**
 * Les pieces epuisees passent en fin de liste.
 */
const outOfStockLast = (items: Product[]): Product[] => {
  const isOut = (p: Product) => p.hasStock === true && (p.stockQuantity == null || p.stockQuantity <= 0);
  return [...items.filter((p) => !isOut(p)), ...items.filter(isOut)];
};

export default async function CollectionsPage({ searchParams }: Props) {
  const { category } = await searchParams;

  let allProducts: Product[] = [];
  try {
    const res = await fetch(`${API_URL}/api/products?limit=200&isActive=true`, { cache: "no-store" });
    if (res.ok) {
      const data: ApiResponse = await res.json();
      allProducts = data?.data || [];
    }
  } catch {
    // API indisponible : la page s'affiche vide plutot que de planter
  }

  const activeCategory = category && CATEGORY_TITLES[category] ? category : "tous";
  const filtered =
    activeCategory === "tous"
      ? diversify(allProducts)
      : allProducts.filter((p) => p.category.toLowerCase() === activeCategory);
  const products = outOfStockLast(filtered);

  const categories = ["tous", "homme", "femme", "traditionnel", "moderne"];
  const productCounts: Record<string, number> = {};
  for (const cat of categories) {
    productCounts[cat] =
      cat === "tous" ? allProducts.length : allProducts.filter((p) => p.category.toLowerCase() === cat).length;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* En-tete */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 md:pt-14 pb-5 md:pb-8">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#C9A45C] mb-2">Collections</p>
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className="font-luxury text-3xl md:text-5xl text-[#0D0D0D]">{CATEGORY_TITLES[activeCategory]}</h1>
          <p className="text-sm text-[#999]">
            {products.length} {products.length > 1 ? "modèles" : "modèle"}
          </p>
        </div>
      </section>

      {/* Filtres — colles sous l'en-tete au defilement */}
      <section className="sticky top-16 md:top-20 z-40 bg-white/95 backdrop-blur-sm border-y border-[#E8E4E0]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <Suspense
            fallback={
              <div className="flex items-center gap-6 h-12">
                {categories.map((cat) => (
                  <div key={cat} className="h-3 w-16 bg-[#EFEDEA] animate-pulse" />
                ))}
              </div>
            }
          >
            <CategoryFilter categories={categories} productCounts={productCounts} />
          </Suspense>
        </div>
      </section>

      {/* Grille */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          {products.length === 0 ? (
            <div className="text-center py-24 md:py-32">
              <h2 className="font-luxury text-2xl md:text-3xl text-[#0D0D0D] mb-3">
                {activeCategory !== "tous"
                  ? `Aucune création dans « ${CATEGORY_TITLES[activeCategory]} » pour le moment`
                  : "Nos créations arrivent bientôt"}
              </h2>
              <p className="text-[#999] mb-10">
                {activeCategory !== "tous"
                  ? "Parcourez toutes nos créations, ou écrivez-nous pour une pièce sur mesure."
                  : "Écrivez-nous pour une pièce sur mesure."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {activeCategory !== "tous" && (
                  <Link href="/collections" className="btn-luxury-primary">
                    Toutes les créations
                  </Link>
                )}
                <a
                  href={WHATSAPP_CUSTOM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border border-[#25D366] text-[#128C4A] px-8 py-3.5 text-[11px] tracking-[0.15em] uppercase hover:bg-[#25D366]/10 transition-colors"
                >
                  Écrire sur WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 lg:gap-x-8">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} eager={index < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sur mesure */}
      <section className="py-16 md:py-24 border-t border-[#E8E4E0]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <h2 className="font-luxury text-3xl md:text-4xl text-[#0D0D0D] mb-4 leading-tight">
            Vous ne trouvez pas ce que vous cherchez ?
          </h2>
          <p className="text-[#666] mb-8 max-w-xl mx-auto">
            Nos artisans créent une pièce unique à vos mesures. Décrivez-nous votre envie, on s&apos;occupe du reste.
          </p>
          <a
            href={WHATSAPP_CUSTOM_URL}
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
      </section>

      <Footer />
    </main>
  );
}
