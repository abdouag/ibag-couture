"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AIResult = {
  name: string;
  description: string;
  imageSuggestion: string;
  images: string[];
  referenceUsed?: boolean;
  provider?: 'gemini' | 'cloudinary' | null;
};

type AIProductModalProps = {
  currentName: string;
  currentCategory: string;
  currentPrice: string;
  isCustomAvailable: boolean;
  referenceImageUrl?: string;
  onApply: (result: { name?: string; description?: string; mainImage?: string; images?: string[] }) => void;
  onClose: () => void;
};

const FREE_IMAGE_LABELS = ["Image principale", "Image secondaire", "Detail (tissu/broderie)"];
const REF_GEMINI_LABELS = ["Vue secondaire (IA)", "Detail tissu (IA)"];
const REF_CLOUDINARY_LABELS = ["Vue recadree", "Detail (zoom)"];

export default function AIProductModal({
  currentName,
  currentCategory,
  currentPrice,
  isCustomAvailable,
  referenceImageUrl,
  onApply,
  onClose,
}: AIProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [applyName, setApplyName] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);
  const [applyImages, setApplyImages] = useState(true);
  const [withImages, setWithImages] = useState(true);

  const categoryLabels: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    traditionnel: "Traditionnel",
    moderne: "Moderne",
  };

  const hasReference = !!referenceImageUrl;

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(withImages ? "Generation du texte..." : "Generation en cours...");

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
          generateImages: withImages,
          referenceImageUrl: withImages && referenceImageUrl ? referenceImageUrl : undefined,
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
      setLoadingStep("");
    }
  };

  const handleApply = () => {
    if (!result) return;
    const applied: { name?: string; description?: string; mainImage?: string; images?: string[] } = {};
    if (applyName) applied.name = result.name;
    if (applyDescription) applied.description = result.description;
    if (applyImages && result.images.length > 0) {
      if (result.referenceUsed) {
        // Reference mode: images are supplementary only, never replace mainImage
        applied.images = result.images;
      } else {
        // Free mode: first image becomes mainImage, rest are additional
        applied.mainImage = result.images[0];
        applied.images = result.images.slice(1);
      }
    }
    onApply(applied);
  };

  const hasImages = result && result.images.length > 0;
  const imageLabels = result?.referenceUsed
    ? (result.provider === 'gemini' ? REF_GEMINI_LABELS : REF_CLOUDINARY_LABELS)
    : FREE_IMAGE_LABELS;

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
              <p className="text-sm text-stone-500">Generation de fiche produit complète</p>
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
            <div className="space-y-3">
              {/* Reference image indicator */}
              {hasReference && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-green-300 flex-shrink-0">
                    <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Image de reference detectee</p>
                    <p className="text-xs text-green-700 mt-0.5">L&apos;image principale reste inchangee. 2 variantes seront generees par IA (Gemini).</p>
                  </div>
                </div>
              )}

              {/* Toggle images */}
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {hasReference ? "Generer 2 variantes IA (Gemini)" : "Generer aussi 3 images IA"}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {hasReference
                      ? "Variantes generees par IA depuis votre photo"
                      : "Images studio professionnelles (plus long, ~30s)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithImages(!withImages)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${withImages ? "bg-amber-500" : "bg-stone-300"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${withImages ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <button
                onClick={generate}
                disabled={!currentCategory}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                {withImages
                  ? hasReference
                    ? "Generer texte + 2 variantes IA"
                    : "Generer texte + 3 images"
                  : "Generer le texte"}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-stone-700">{loadingStep}</p>
                {withImages && (
                  <p className="text-xs text-stone-400 mt-1">La generation d&apos;images peut prendre 30-60 secondes</p>
                )}
              </div>
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

              {/* Generated Images */}
              {hasImages ? (
                <div className="border border-stone-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-semibold text-stone-900">
                        {result.referenceUsed
                          ? result.provider === 'gemini'
                            ? `Variantes Gemini (${result.images.length})`
                            : `Recadrages photo (${result.images.length})`
                          : `Images generees (${result.images.length})`}
                      </label>
                      {result.referenceUsed && (
                        <p className="text-xs text-green-600 mt-0.5">
                          {result.provider === 'gemini'
                            ? "Generees par IA Gemini depuis votre photo — image principale inchangee"
                            : "Recadrages de votre photo originale — image principale inchangee"}
                        </p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyImages}
                        onChange={(e) => setApplyImages(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs text-stone-500">Appliquer</span>
                    </label>
                  </div>
                  <div className={`grid ${result.referenceUsed ? "grid-cols-2" : "grid-cols-3"} gap-3`}>
                    {result.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <div className={`${(result.referenceUsed ? i === 1 : i === 2) ? "aspect-square" : "aspect-[2/3]"} rounded-lg overflow-hidden bg-stone-100 border border-stone-200`}>
                          <img
                            src={url}
                            alt={imageLabels[i] || `Image ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-stone-500 text-center mt-1.5">{imageLabels[i] || `Image ${i + 1}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Image suggestion text (when no images generated) */
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <label className="text-sm font-semibold text-amber-900 block mb-2">
                    Suggestion photo (reference)
                  </label>
                  <p className="text-sm text-amber-800 leading-relaxed">{result.imageSuggestion}</p>
                </div>
              )}

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
                  disabled={!applyName && !applyDescription && !(applyImages && hasImages)}
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
