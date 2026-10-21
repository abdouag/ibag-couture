"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CategoryFilterProps = {
  categories: string[];
  productCounts: Record<string, number>;
};

export default function CategoryFilter(props: CategoryFilterProps) {
  return (
    <Suspense>
      <CategoryFilterInner {...props} />
    </Suspense>
  );
}

function CategoryFilterInner({ categories, productCounts }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "tous";

  const handleFilter = (category: string) => {
    if (category === "tous") {
      router.push("/collections", { scroll: false });
    } else {
      router.push(`/collections?category=${category}`, { scroll: false });
    }
  };

  // Onglets soulignes plutot que pastilles arrondies : le meme vocabulaire
  // que le reste de la boutique (angles vifs, typographie espacee).
  return (
    <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide" role="tablist">
      {categories.map((category) => {
        const count = productCounts[category] ?? 0;
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleFilter(category)}
            className={`whitespace-nowrap py-4 text-[11px] uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors duration-300 ${
              isActive
                ? "border-[#0D0D0D] text-[#0D0D0D]"
                : "border-transparent text-[#999] hover:text-[#0D0D0D]"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {category !== "tous" && count > 0 && (
              <span className="ml-1.5 text-[#C9A45C] tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
