"use client";

import dynamic from "next/dynamic";

const FooterMap = dynamic(() => import("@/components/FooterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-stone-800 rounded-lg flex items-center justify-center text-stone-400 text-sm">
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        Ibag Couture &mdash; Pikine, Dakar
      </span>
    </div>
  ),
});

export default function FooterMapWrapper() {
  return <FooterMap />;
}
