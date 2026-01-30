"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AIResult = {
  name: string;
  description: string;
  imageSuggestion: string;
};

type AIProductModalProps = {
  currentName: string;
  currentCategory: string;
  currentPrice: string;
  isCustomAvailable: boolean;
  onApply: (result: { name?: string; description?: string }) => void;
  onClose: () => void;
};

export default function AIProductModal({
  currentName,
  currentCategory,
  currentPrice,
  isCustomAvailable,
  onApply,
  onClose,
}: AIProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [applyName, setApplyName] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);

  const categoryLabels: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    traditionnel: "Traditionnel",
    moderne: "Moderne",
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/generate-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: currentName || undefined,
          category: currentCategory,
          basePrice: currentPrice ? Number(currentPrice) : undefined,
          isCustomAvailable,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de la generation");
        return;
      }

      setResult(data.data);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply({
      name: applyName ? result.name : undefined,
      description: applyDescription ? result.description : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Assistant IA</h2>
              <p className="text-sm text-stone-500">Generation de fiche produit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Context info */}
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-sm font-medium text-stone-700 mb-2">Contexte actuel</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-600">
                {categoryLabels[currentCategory] || "Non defini"}
              </span>
              <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-600">
                {isCustomAvailable ? "Sur-mesure" : "Pret-a-porter"}
              </span>
              {currentPrice && (
                <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-600">
                  {Number(currentPrice).toLocaleString("fr-FR")} FCFA
                </span>
              )}
              {currentName && (
                <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-600">
                  {currentName}
                </span>
              )}
            </div>
          </div>

          {/* Generate button */}
          {!result && !loading && (
            <button
              onClick={generate}
              disabled={!currentCategory}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generer des suggestions
            </button>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm text-stone-500">L&apos;IA genere des suggestions...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={generate}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Reessayer
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Name */}
              <div className="border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-stone-900">Nom suggere</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyName}
                      onChange={(e) => setApplyName(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-stone-500">Appliquer</span>
                  </label>
                </div>
                <p className="text-sm text-stone-700">{result.name}</p>
              </div>

              {/* Description */}
              <div className="border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-stone-900">Description suggeree</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyDescription}
                      onChange={(e) => setApplyDescription(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-stone-500">Appliquer</span>
                  </label>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{result.description}</p>
              </div>

              {/* Image suggestion */}
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <label className="text-sm font-semibold text-amber-900 block mb-2">
                  Suggestion photo (reference)
                </label>
                <p className="text-sm text-amber-800 leading-relaxed">{result.imageSuggestion}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={generate}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Regenerer
                </button>
                <button
                  onClick={handleApply}
                  disabled={!applyName && !applyDescription}
                  className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  Appliquer la selection
                </button>
              </div>
            </div>
          )}

          {!currentCategory && (
            <p className="text-sm text-amber-600 text-center">
              Selectionnez une categorie dans le formulaire avant de generer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
