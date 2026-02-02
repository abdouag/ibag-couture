"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ImageAnalysis = {
  garmentType: string;
  style: string;
  material: string;
  targetGender: string;
  dominantColor: string;
  details: string;
  confidence: string;
};

type AIResult = {
  name: string;
  description: string;
  imageSuggestion: string;
  tags?: string[];
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

const REF_GEMINI_LABELS = ["Vue secondaire (IA)", "Vue dos (IA)", "Detail tissu (IA)"];
const REF_CLOUDINARY_LABELS = ["Vue recadree", "Detail (zoom)"];

type Step = "analyze" | "text" | "images" | "done";

export default function AIProductModal({
  currentName,
  currentCategory,
  currentPrice,
  isCustomAvailable,
  referenceImageUrl,
  onApply,
  onClose,
}: AIProductModalProps) {
  const [step, setStep] = useState<Step>("analyze");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);

  // Text generation state
  const [result, setResult] = useState<AIResult | null>(null);

  // Apply toggles
  const [applyName, setApplyName] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);
  const [applyImages, setApplyImages] = useState(true);

  const hasReference = !!referenceImageUrl;

  const categoryLabels: Record<string, string> = {
    homme: "Homme",
    femme: "Femme",
    traditionnel: "Traditionnel",
    moderne: "Moderne",
  };

  // Step 1: Analyze image with Gemini Vision
  const handleAnalyze = async () => {
    if (!referenceImageUrl) {
      // No image — skip to text generation
      setStep("text");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep("Analyse de l'image...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/analyze-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: referenceImageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de l'analyse");
        return;
      }

      setAnalysis(data.data);
      setStep("text");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Step 2: Generate text (name, description, tags)
  const handleGenerateText = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep("Generation du texte...");

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
          generateImages: false,
          imageAnalysis: analysis || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de la generation");
        return;
      }

      setResult(data.data);
      setStep("images");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Step 3: Generate images (optional)
  const handleGenerateImages = async () => {
    if (!referenceImageUrl || !result) return;

    setLoading(true);
    setError(null);
    setLoadingStep("Generation des images IA...");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/generate-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: result.name || currentName || undefined,
          category: currentCategory,
          basePrice: currentPrice ? Number(currentPrice) : undefined,
          isCustomAvailable,
          generateImages: true,
          referenceImageUrl,
          imageAnalysis: analysis || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors de la generation d'images");
        return;
      }

      // Merge images into existing result
      setResult((prev) => prev ? {
        ...prev,
        images: data.data.images || [],
        referenceUsed: data.data.referenceUsed,
        provider: data.data.provider,
      } : null);
      setStep("done");
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
        applied.images = result.images;
      } else {
        applied.mainImage = result.images[0];
        applied.images = result.images.slice(1);
      }
    }
    onApply(applied);
  };

  const handleSkipImages = () => {
    setStep("done");
  };

  const hasImages = result && result.images.length > 0;
  const imageLabels = result?.referenceUsed
    ? (result.provider === 'gemini' ? REF_GEMINI_LABELS : REF_CLOUDINARY_LABELS)
    : [];

  // Step indicators
  const steps = [
    { key: "analyze", label: "Analyse", num: 1 },
    { key: "text", label: "Texte", num: 2 },
    { key: "images", label: "Images", num: 3 },
    { key: "done", label: "Appliquer", num: 4 },
  ];
  const stepOrder = ["analyze", "text", "images", "done"];
  const currentIdx = stepOrder.indexOf(step);

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
              <p className="text-sm text-stone-500">Gemini — fiche produit intelligente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const thisIdx = stepOrder.indexOf(s.key);
              const isActive = step === s.key;
              const isDone = thisIdx < currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-2 flex-1">
                  {i > 0 && <div className={`flex-1 h-px ${isDone ? "bg-amber-500" : "bg-stone-200"}`} />}
                  <div className={`flex items-center gap-1.5 ${isActive ? "text-amber-600" : isDone ? "text-green-600" : "text-stone-400"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive ? "bg-amber-500 text-white" : isDone ? "bg-green-500 text-white" : "bg-stone-200 text-stone-500"
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : s.num}
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Context info */}
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-sm font-medium text-stone-700 mb-2">Contexte</p>
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
                {step === "images" && (
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
                onClick={() => setError(null)}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Fermer
              </button>
            </div>
          )}

          {/* ── STEP 1: ANALYZE ── */}
          {step === "analyze" && !loading && (
            <div className="space-y-4">
              {hasReference ? (
                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-green-300 flex-shrink-0">
                    <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Image principale detectee</p>
                    <p className="text-xs text-green-700 mt-1">
                      Gemini va analyser cette image pour identifier le type de vetement, le style, la matiere et les couleurs.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-medium text-amber-900">Aucune image uploadee</p>
                  <p className="text-xs text-amber-700 mt-1">
                    L&apos;analyse visuelle sera ignoree. Le texte sera genere a partir de la categorie et des informations saisies.
                  </p>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!currentCategory}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {hasReference ? "Analyser l'image" : "Passer a la generation"}
              </button>

              {!currentCategory && (
                <p className="text-sm text-amber-600 text-center">
                  Selectionnez une categorie dans le formulaire avant de continuer.
                </p>
              )}
            </div>
          )}

          {/* ── STEP 2: TEXT — show analysis results + generate button ── */}
          {step === "text" && !loading && (
            <div className="space-y-4">
              {/* Analysis results */}
              {analysis && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-semibold text-green-900">Analyse terminee</p>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      analysis.confidence === 'high' ? 'bg-green-200 text-green-800' :
                      analysis.confidence === 'medium' ? 'bg-amber-200 text-amber-800' :
                      'bg-stone-200 text-stone-700'
                    }`}>
                      {analysis.confidence === 'high' ? 'Confiance haute' :
                       analysis.confidence === 'medium' ? 'Confiance moyenne' : 'Confiance basse'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2.5 border border-green-100">
                      <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Type</p>
                      <p className="text-sm font-medium text-stone-900">{analysis.garmentType}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-green-100">
                      <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Style</p>
                      <p className="text-sm font-medium text-stone-900">{analysis.style}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-green-100">
                      <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Matiere</p>
                      <p className="text-sm font-medium text-stone-900">{analysis.material}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-green-100">
                      <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Couleur</p>
                      <p className="text-sm font-medium text-stone-900">{analysis.dominantColor}</p>
                    </div>
                  </div>
                  {analysis.details && (
                    <p className="text-xs text-green-800 mt-2 italic">{analysis.details}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleGenerateText}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generer nom + description
              </button>
            </div>
          )}

          {/* ── STEP 3: IMAGES — show text results + optional image generation ── */}
          {step === "images" && !loading && result && (
            <div className="space-y-4">
              {/* Generated text preview */}
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

              {result.tags && result.tags.length > 0 && (
                <div className="border border-stone-200 rounded-xl p-4">
                  <label className="text-sm font-semibold text-stone-900 block mb-2">Tags SEO</label>
                  <div className="flex flex-wrap gap-1.5">
                    {result.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Image generation CTA */}
              <div className="flex gap-3 pt-2">
                {hasReference ? (
                  <button
                    onClick={handleGenerateImages}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
                    </svg>
                    Generer 3 images IA
                  </button>
                ) : null}
                <button
                  onClick={handleSkipImages}
                  className={`${hasReference ? 'flex-1' : 'w-full'} py-3 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors`}
                >
                  {hasReference ? "Passer" : "Continuer"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: DONE — show everything + apply ── */}
          {step === "done" && !loading && result && (
            <div className="space-y-4">
              {/* Text summary */}
              <div className="border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-stone-900">Nom</label>
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

              <div className="border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-stone-900">Description</label>
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
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line line-clamp-4">{result.description}</p>
              </div>

              {/* Generated Images */}
              {hasImages && (
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
                            ? "Generees par Gemini — image principale inchangee"
                            : "Recadrages de votre photo — image principale inchangee"}
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
                  <div className="grid grid-cols-3 gap-3">
                    {result.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <div className={`${i === 2 ? "aspect-square" : "aspect-[2/3]"} rounded-lg overflow-hidden bg-stone-100 border border-stone-200`}>
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
              )}

              {/* Regenerate images button */}
              {hasReference && (
                <button
                  onClick={handleGenerateImages}
                  disabled={loading}
                  className="w-full py-2.5 border border-amber-300 bg-amber-50 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  {hasImages ? "Regenerer les images" : "Generer les images IA"}
                </button>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setResult(null);
                    setAnalysis(null);
                    setStep("analyze");
                  }}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Tout regenerer
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
        </div>
      </div>
    </div>
  );
}
