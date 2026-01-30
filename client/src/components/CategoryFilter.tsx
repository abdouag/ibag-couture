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

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
      {categories.map((category) => {
        const count = productCounts[category] ?? 0;
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => handleFilter(category)}
            className={`px-6 py-2 text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${
              isActive
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {category !== "tous" && ` (${count})`}
          </button>
        );
      })}
    </div>
  );
}
