"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Size chart data (cm)
const SIZE_CHART = [
  { size: "S",   chest: [82, 88],  waist: [64, 70],  hips: [88, 94],  shoulders: [38, 40] },
  { size: "M",   chest: [88, 94],  waist: [70, 76],  hips: [94, 100], shoulders: [40, 42] },
  { size: "L",   chest: [94, 100], waist: [76, 82],  hips: [100, 106], shoulders: [42, 44] },
  { size: "XL",  chest: [100, 108], waist: [82, 90], hips: [106, 114], shoulders: [44, 46] },
  { size: "XXL", chest: [108, 116], waist: [90, 98], hips: [114, 122], shoulders: [46, 48] },
];

type Tab = "chart" | "measure" | "recommend";

function findRecommendedSize(chest: number, waist: number, hips: number) {
  let bestSize = "";
  let bestScore = Infinity;

  for (const row of SIZE_CHART) {
    const midChest = (row.chest[0] + row.chest[1]) / 2;
    const midWaist = (row.waist[0] + row.waist[1]) / 2;
    const midHips = (row.hips[0] + row.hips[1]) / 2;
    const score =
      Math.abs(chest - midChest) +
      Math.abs(waist - midWaist) +
      Math.abs(hips - midHips);
    if (score < bestScore) {
      bestScore = score;
      bestSize = row.size;
    }
  }

  return bestSize;
}

function SizeChartTable({ availableSizes }: { availableSizes?: string[] }) {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="w-full text-xs sm:text-sm md:text-base">
        <thead>
          <tr className="border-b-2 border-stone-200">
            <th className="py-2.5 px-1.5 sm:px-3 text-left text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-stone-400 font-medium w-12 sm:w-auto"></th>
            <th className="py-2.5 px-1.5 sm:px-3 text-center text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-stone-400 font-medium">Poitrine</th>
            <th className="py-2.5 px-1.5 sm:px-3 text-center text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-stone-400 font-medium">Taille</th>
            <th className="py-2.5 px-1.5 sm:px-3 text-center text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-stone-400 font-medium">Hanches</th>
            <th className="py-2.5 px-1.5 sm:px-3 text-center text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase text-stone-400 font-medium hidden sm:table-cell">Épaules</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((row) => {
            const isAvailable = !availableSizes || availableSizes.length === 0 || availableSizes.includes(row.size);
            return (
              <tr
                key={row.size}
                className={`border-b border-stone-100 transition-colors ${
                  isAvailable ? "hover:bg-amber-50/50" : "opacity-40"
                }`}
              >
                <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-sm font-medium text-sm sm:text-base ${
                    isAvailable
                      ? "bg-stone-900 text-white"
                      : "bg-stone-200 text-stone-400"
                  }`}>
                    {row.size}
                  </span>
                </td>
                <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-stone-700 whitespace-nowrap">{row.chest[0]}–{row.chest[1]}</td>
                <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-stone-700 whitespace-nowrap">{row.waist[0]}–{row.waist[1]}</td>
                <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-stone-700 whitespace-nowrap">{row.hips[0]}–{row.hips[1]}</td>
                <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-stone-700 whitespace-nowrap hidden sm:table-cell">{row.shoulders[0]}–{row.shoulders[1]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-stone-400 mt-1.5 px-1.5 sm:px-0">Toutes les mesures sont en cm</p>
    </div>
  );
}

function BodyDiagram() {
  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 280 420" className="w-full max-w-[260px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body silhouette */}
        <path
          d="M140 40 C140 40 155 40 160 55 C165 70 160 85 160 85 L165 95 C175 100 195 110 200 120 L215 150 C220 160 218 165 210 165 L195 160 L185 155 L180 170 L182 240 L190 310 L188 370 C188 380 178 385 170 385 L155 385 C150 385 148 380 148 375 L150 310 L145 260 L140 310 L138 375 C138 380 135 385 130 385 L115 385 C107 385 97 380 97 370 L95 310 L103 240 L105 170 L100 155 L90 160 L75 165 C67 165 65 160 70 150 L85 120 C90 110 110 100 120 95 L125 85 C125 85 120 70 125 55 C130 40 140 40 140 40 Z"
          fill="#F5F0EB"
          stroke="#A8A29E"
          strokeWidth="1.5"
        />
        {/* Head */}
        <circle cx="140" cy="25" r="20" fill="#F5F0EB" stroke="#A8A29E" strokeWidth="1.5" />

        {/* Shoulder line */}
        <line x1="85" y1="118" x2="195" y2="118" stroke="#B45309" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="85" cy="118" r="4" fill="#B45309" />
        <circle cx="195" cy="118" r="4" fill="#B45309" />

        {/* Chest line */}
        <line x1="98" y1="155" x2="182" y2="155" stroke="#B45309" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="98" cy="155" r="4" fill="#B45309" />
        <circle cx="182" cy="155" r="4" fill="#B45309" />

        {/* Waist line */}
        <line x1="103" y1="200" x2="177" y2="200" stroke="#B45309" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="103" cy="200" r="4" fill="#B45309" />
        <circle cx="177" cy="200" r="4" fill="#B45309" />

        {/* Hips line */}
        <line x1="97" y1="240" x2="183" y2="240" stroke="#B45309" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="97" cy="240" r="4" fill="#B45309" />
        <circle cx="183" cy="240" r="4" fill="#B45309" />

        {/* Labels */}
        <text x="218" y="122" fill="#78716C" fontSize="12" fontFamily="sans-serif">Épaules</text>
        <text x="205" y="159" fill="#78716C" fontSize="12" fontFamily="sans-serif">Poitrine</text>
        <text x="200" y="204" fill="#78716C" fontSize="12" fontFamily="sans-serif">Taille</text>
        <text x="206" y="244" fill="#78716C" fontSize="12" fontFamily="sans-serif">Hanches</text>

        {/* Connecting lines to labels */}
        <line x1="195" y1="118" x2="215" y2="118" stroke="#D6D3D1" strokeWidth="1" />
        <line x1="182" y1="155" x2="202" y2="155" stroke="#D6D3D1" strokeWidth="1" />
        <line x1="177" y1="200" x2="197" y2="200" stroke="#D6D3D1" strokeWidth="1" />
        <line x1="183" y1="240" x2="203" y2="240" stroke="#D6D3D1" strokeWidth="1" />
      </svg>

      <div className="w-full grid grid-cols-2 gap-3">
        {[
          { label: "Épaules", desc: "D'une pointe d'épaule à l'autre" },
          { label: "Poitrine", desc: "Au niveau le plus fort de la poitrine" },
          { label: "Taille", desc: "Au creux naturel de la taille" },
          { label: "Hanches", desc: "Au niveau le plus fort des hanches" },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-stone-50 rounded-sm border border-stone-100">
            <p className="text-sm font-medium text-stone-800 mb-0.5">{m.label}</p>
            <p className="text-xs text-stone-500 leading-snug">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-sm">
        <p className="text-sm text-amber-800 font-medium mb-2">Conseils de mesure</p>
        <ul className="text-xs text-amber-700 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            Utilisez un mètre ruban souple
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            Tenez-vous droit, bras le long du corps
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            Ne serrez pas trop le ruban
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            Faites-vous aider si possible
          </li>
        </ul>
      </div>
    </div>
  );
}

function SizeRecommender() {
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleRecommend = useCallback(() => {
    const c = parseFloat(chest);
    const w = parseFloat(waist);
    const h = parseFloat(hips);
    if (!c || !w || !h) return;
    setResult(findRecommendedSize(c, w, h));
  }, [chest, waist, hips]);

  const allFilled = chest.trim() !== "" && waist.trim() !== "" && hips.trim() !== "";

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-500">
        Entrez vos mensurations et nous vous recommanderons la taille idéale.
      </p>

      <div className="space-y-3">
        {[
          { label: "Tour de poitrine", value: chest, setter: setChest, placeholder: "ex: 92" },
          { label: "Tour de taille", value: waist, setter: setWaist, placeholder: "ex: 74" },
          { label: "Tour de hanches", value: hips, setter: setHips, placeholder: "ex: 98" },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">{field.label}</label>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="200"
                value={field.value}
                onChange={(e) => { field.setter(e.target.value); setResult(null); }}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 pr-12 border border-stone-300 rounded-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">cm</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleRecommend}
        disabled={!allFilled}
        className={`w-full py-3.5 text-sm tracking-[0.15em] uppercase font-medium rounded-sm transition-all duration-300 ${
          allFilled
            ? "bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        }`}
      >
        Trouver ma taille
      </button>

      {result && (
        <div className="animate-fadeIn text-center p-6 bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-sm">
          <p className="text-sm text-stone-500 mb-2">Taille recommandée</p>
          <span className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 text-white text-2xl font-luxury rounded-sm shadow-lg">
            {result}
          </span>
          <p className="text-xs text-stone-400 mt-3">
            En cas de doute entre deux tailles, optez pour la taille supérieure.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SizeGuideModal({
  availableSizes,
  isCustomAvailable,
}: {
  availableSizes?: string[];
  isCustomAvailable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chart");
  const portalRef = useRef<HTMLElement | null>(null);

  // Ensure portal target exists on client only
  useEffect(() => {
    portalRef.current = document.body;
  }, []);

  // Lock body scroll, lower header/CTA z-index so modal is on top, close on Escape
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    // Force the sticky header AND the fixed bottom CTA below the modal overlay
    const stickyHeader = document.querySelector(".sticky.top-0") as HTMLElement | null;
    const fixedBottomCTA = document.querySelector(".fixed.bottom-0") as HTMLElement | null;
    if (stickyHeader) stickyHeader.style.zIndex = "0";
    if (fixedBottomCTA) fixedBottomCTA.style.zIndex = "0";

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      if (stickyHeader) stickyHeader.style.zIndex = "";
      if (fixedBottomCTA) fixedBottomCTA.style.zIndex = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "chart", label: "Tableau" },
    { key: "measure", label: "Comment mesurer" },
    { key: "recommend", label: "Ma taille" },
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 transition-colors duration-200 cursor-pointer group"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
        <span className="group-hover:underline underline-offset-4">Guide de taille</span>
      </button>

      {/* Portal: render modal at document.body to escape all stacking contexts */}
      {isOpen && portalRef.current && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          id="size-guide-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            zIndex: 2147483647,
            isolation: "isolate",
          }}
        >
          {/* Panel — takes the ENTIRE screen, nothing can cover it */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header with prominent close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #e7e5e4",
                flexShrink: 0,
                backgroundColor: "#fff",
              }}
            >
              <h2 className="text-lg font-luxury text-stone-900">Guide de taille</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: "#f5f5f4",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-200" style={{ flexShrink: 0, padding: "0 16px" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? "text-stone-900"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-700" />
                  )}
                </button>
              ))}
            </div>

            {/* Content — scrollable, takes remaining space */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", WebkitOverflowScrolling: "touch" }}>
              {activeTab === "chart" && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500">
                    Comparez vos mensurations au tableau ci-dessous.
                  </p>
                  <SizeChartTable availableSizes={availableSizes} />
                  {isCustomAvailable && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-sm">
                      <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      <p className="text-sm text-stone-700">
                        Ce modèle est aussi disponible <strong>sur-mesure</strong> pour un ajustement parfait.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "measure" && <BodyDiagram />}

              {activeTab === "recommend" && <SizeRecommender />}
            </div>

            {/* Bottom close button for easy access */}
            <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid #e7e5e4", backgroundColor: "#fff" }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#1c1917",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        portalRef.current
      )}
    </>
  );
}
