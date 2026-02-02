"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

type AIProductModalProps = {
  currentName: string;
  currentCategory: string;
  currentPrice: string;
  isCustomAvailable: boolean;
  referenceImageUrl?: string;
  onApply: (result: { name?: string; description?: string; mainImage?: string; images?: string[] }) => void;
  onClose: () => void;
  onSuccess?: () => void;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  imageUrls?: string[];
  analysis?: ImageAnalysis;
  generatedText?: { name: string; description: string; tags?: string[] };
  generatedImages?: string[];
};

type ChatStep =
  | "welcome"
  | "upload"
  | "analyzing"
  | "name"
  | "category"
  | "price"
  | "sizes"
  | "stock"
  | "generating"
  | "review"
  | "ask-images"
  | "generating-images"
  | "creating"
  | "done";

const CATEGORIES = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "traditionnel", label: "Traditionnel" },
  { value: "moderne", label: "Moderne" },
];

const ALL_SIZES = ["S", "M", "L", "XL", "XXL"];

let msgId = 0;
function nextId() {
  return `msg-${++msgId}-${Date.now()}`;
}

export default function AIProductModal({
  currentName,
  currentCategory,
  currentPrice,
  isCustomAvailable,
  referenceImageUrl,
  onApply,
  onClose,
  onSuccess,
}: AIProductModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<ChatStep>("welcome");
  const [textInput, setTextInput] = useState("");
  const [uploading, setUploading] = useState(false);

  // Collected data
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    referenceImageUrl ? [referenceImageUrl] : []
  );
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [productName, setProductName] = useState(currentName || "");
  const [category, setCategory] = useState(currentCategory || "");
  const [basePrice, setBasePrice] = useState(currentPrice || "");
  const [promoPrice, setPromoPrice] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [hasStock, setHasStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [generatedText, setGeneratedText] = useState<{
    name: string;
    description: string;
    tags?: string[];
  } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const addMessage = useCallback(
    (role: "assistant" | "user", text: string, extra?: Partial<ChatMessage>) => {
      const msg: ChatMessage = { id: nextId(), role, text, ...extra };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  // Initialize welcome
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage(
        "assistant",
        "Bonjour ! Je suis l'Assistant IA d'Ibag Couture.\n\nJe vais vous guider pour creer votre fiche produit. Comment puis-je vous aider ?"
      );
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, step, scrollToBottom]);

  // ── Image Upload ──
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        addMessage("assistant", "Format non supporte. Utilisez JPG, PNG ou WebP.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addMessage("assistant", "L'image depasse 5MB. Veuillez en choisir une plus legere.");
        return;
      }
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      fileArray.forEach((file) => formData.append("images", file));

      const res = await fetch(`${API_URL}/api/uploads/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Erreur lors de l'upload");

      if (data.success && data.data) {
        const newUrls: string[] = data.data.map((f: { url: string }) => f.url);
        const allImages = [...uploadedImages, ...newUrls];
        setUploadedImages(allImages);

        addMessage("user", `${newUrls.length} image(s) ajoutee(s)`, {
          imageUrls: newUrls,
        });

        // Start AI analysis
        addMessage(
          "assistant",
          "Merci pour l'image ! Laissez-moi l'analyser..."
        );
        setStep("analyzing");

        // Run analysis
        await runAnalysis(allImages[0]);
      }
    } catch (err) {
      addMessage(
        "assistant",
        `Erreur lors de l'upload : ${err instanceof Error ? err.message : "Erreur inconnue"}. Reessayez.`
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── AI Analysis ──
  const runAnalysis = async (imageUrl: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/analyze-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage(
          "assistant",
          "Je n'ai pas pu analyser l'image, mais on peut continuer manuellement.\n\nQuel nom souhaitez-vous donner a ce produit ?"
        );
        setStep("name");
        return;
      }

      const a = data.data as ImageAnalysis;
      setAnalysis(a);

      addMessage("assistant", "Voici ce que j'ai identifie :", { analysis: a });

      setTimeout(() => {
        addMessage(
          "assistant",
          "Quel nom souhaitez-vous donner a ce produit ?\n\nTapez un nom ou laissez vide pour que je vous en suggere un."
        );
        setStep("name");
      }, 500);
    } catch {
      addMessage(
        "assistant",
        "Erreur lors de l'analyse. On continue.\n\nQuel nom souhaitez-vous donner a ce produit ?"
      );
      setStep("name");
    }
  };

  // ── Submit text input based on step ──
  const handleSubmitText = () => {
    const val = textInput.trim();
    setTextInput("");

    if (step === "name") {
      const name = val || "";
      setProductName(name);
      addMessage("user", name || "(nom a generer par l'IA)");

      if (category) {
        // Already have category, ask for price
        addMessage("assistant", `Categorie: ${CATEGORIES.find((c) => c.value === category)?.label || category}.\n\nMaintenant, definissez le prix en FCFA.`);
        setStep("price");
      } else {
        addMessage("assistant", "Selectionnez la categorie de votre produit.");
        setStep("category");
      }
    } else if (step === "price") {
      const price = val || "0";
      setBasePrice(price);
      addMessage("user", `${Number(price).toLocaleString("fr-FR")} FCFA`);

      addMessage(
        "assistant",
        "Generation de la fiche produit en cours..."
      );
      setStep("generating");
      runTextGeneration(productName, category, price);
    }
  };

  // ── Category selection ──
  const handleSelectCategory = (cat: string) => {
    setCategory(cat);
    const label = CATEGORIES.find((c) => c.value === cat)?.label || cat;
    addMessage("user", label);

    if (basePrice) {
      addMessage("assistant", "Generation de la fiche produit en cours...");
      setStep("generating");
      runTextGeneration(productName, category || cat, basePrice);
    } else {
      addMessage(
        "assistant",
        "Definissez le prix de base en FCFA.\n\nVous pouvez aussi ajouter un prix promotionnel."
      );
      setStep("price");
    }
  };

  // ── Price submission (from dedicated inputs) ──
  const handleSubmitPrice = () => {
    const price = basePrice || "0";
    const priceText = promoPrice
      ? `Prix: ${Number(price).toLocaleString("fr-FR")} FCFA, Promo: ${Number(promoPrice).toLocaleString("fr-FR")} FCFA`
      : `${Number(price).toLocaleString("fr-FR")} FCFA`;
    addMessage("user", priceText);

    addMessage("assistant", "Selectionnez les tailles disponibles pour ce produit.");
    setStep("sizes");
  };

  // ── Sizes submission ──
  const handleSubmitSizes = () => {
    const sizesText = selectedSizes.length > 0 ? selectedSizes.join(", ") : "Aucune taille";
    addMessage("user", sizesText);

    addMessage(
      "assistant",
      "Souhaitez-vous activer la gestion du stock ?\n\nSi oui, indiquez la quantite disponible."
    );
    setStep("stock");
  };

  // ── Stock submission ──
  const handleSubmitStock = () => {
    if (hasStock && stockQuantity) {
      addMessage("user", `Stock: ${stockQuantity} unites`);
    } else {
      addMessage("user", "Pas de gestion de stock");
    }

    addMessage("assistant", "Generation de la fiche produit en cours...");
    setStep("generating");
    runTextGeneration(productName, category, basePrice);
  };

  // ── AI Text Generation ──
  const runTextGeneration = async (name: string, cat: string, price: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/generate-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          category: cat,
          basePrice: price ? Number(price) : undefined,
          isCustomAvailable,
          generateImages: false,
          imageAnalysis: analysis || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage(
          "assistant",
          `Erreur: ${data.message || "Impossible de generer le texte."}. Reessayez.`
        );
        setStep("review");
        return;
      }

      const gen = {
        name: data.data.name || name,
        description: data.data.description || "",
        tags: data.data.tags || [],
      };
      setGeneratedText(gen);
      if (!productName && gen.name) setProductName(gen.name);

      addMessage("assistant", "Voici la fiche produit generee :", {
        generatedText: gen,
      });

      if (uploadedImages.length > 0) {
        setTimeout(() => {
          addMessage(
            "assistant",
            "Voulez-vous que je genere des images secondaires (vue de dos, detail tissu) a partir de votre photo ?"
          );
          setStep("ask-images");
        }, 500);
      } else {
        setTimeout(() => {
          goToCreateStep();
        }, 500);
      }
    } catch {
      addMessage(
        "assistant",
        "Erreur de connexion. Veuillez reessayer."
      );
      setStep("price");
    }
  };

  // ── Image Generation ──
  const handleGenerateImages = async () => {
    addMessage("user", "Oui, genere les images");
    addMessage(
      "assistant",
      "Generation des images secondaires en cours...\nCela peut prendre 30 a 60 secondes."
    );
    setStep("generating-images");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/admin/ai/generate-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName || generatedText?.name,
          category,
          basePrice: basePrice ? Number(basePrice) : undefined,
          isCustomAvailable,
          generateImages: true,
          referenceImageUrl: uploadedImages[0],
          imageAnalysis: analysis || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage(
          "assistant",
          `Erreur: ${data.message || "Generation d'images echouee."}. On continue sans images supplementaires.`
        );
        goToCreateStep();
        return;
      }

      const imgs = data.data.images || [];
      setGeneratedImages(imgs);

      addMessage("assistant", `${imgs.length} image(s) generee(s) !`, {
        generatedImages: imgs,
      });

      setTimeout(() => {
        goToCreateStep();
      }, 500);
    } catch {
      addMessage(
        "assistant",
        "Erreur lors de la generation d'images. On continue sans images supplementaires."
      );
      goToCreateStep();
    }
  };

  const handleSkipImages = () => {
    addMessage("user", "Non, passer cette etape");
    goToCreateStep();
  };

  const goToCreateStep = () => {
    addMessage(
      "assistant",
      "Votre fiche produit est prete ! Cliquez sur 'Publier' pour creer le produit."
    );
    setStep("done");
  };

  // ── Create product directly via API ──
  const handleCreateProduct = async () => {
    setStep("creating");
    addMessage("user", "Publier le produit");
    addMessage("assistant", "Creation du produit en cours...");

    try {
      const token = localStorage.getItem("token");
      const finalName = generatedText?.name || productName;

      const allImages = [
        ...uploadedImages,
        ...generatedImages,
      ];

      const payload: Record<string, unknown> = {
        name: finalName,
        category,
        basePrice: parseFloat(basePrice) || 0,
        description: generatedText?.description || "",
        productionTime: 7,
        isActive: true,
        isCustomAvailable,
        mainImage: allImages[0] || undefined,
        images: allImages.length > 0 ? allImages : undefined,
        availableSizes: selectedSizes.length > 0 ? selectedSizes : undefined,
        hasStock,
        stockQuantity: hasStock && stockQuantity ? parseInt(stockQuantity) : null,
        promoPrice: promoPrice ? parseFloat(promoPrice) : null,
      };

      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        addMessage(
          "assistant",
          "Produit cree avec succes ! Il est maintenant visible sur le site.\n\nRedirection en cours..."
        );
        setStep("done");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
          }
        }, 2000);
      } else {
        addMessage(
          "assistant",
          `Erreur: ${data.message || "Impossible de creer le produit."}. Verifiez les informations et reessayez.`
        );
        setStep("done");
      }
    } catch {
      addMessage(
        "assistant",
        "Erreur de connexion au serveur. Verifiez votre connexion et reessayez."
      );
      setStep("done");
    }
  };

  // ── Start flow ──
  const handleStartFlow = () => {
    addMessage("user", "Je veux ajouter un nouveau produit");

    if (uploadedImages.length > 0) {
      // Already has reference image, skip upload
      addMessage("assistant", "Image principale detectee ! Laissez-moi l'analyser...");
      setStep("analyzing");
      runAnalysis(uploadedImages[0]);
    } else {
      addMessage(
        "assistant",
        "Commençons par l'image.\n\nUploadez une photo de votre produit. Le format carre est recommande pour un meilleur rendu."
      );
      setStep("upload");
    }
  };

  const handleSkipUpload = () => {
    addMessage("user", "Passer l'image");
    addMessage(
      "assistant",
      "Pas de probleme ! On continue sans image.\n\nQuel nom souhaitez-vous donner a ce produit ?"
    );
    setStep("name");
  };

  // ── Render message content ──
  const renderMessage = (msg: ChatMessage) => {
    return (
      <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
        {msg.role === "assistant" && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        )}

        <div
          className={`max-w-[85%] ${
            msg.role === "user"
              ? "bg-stone-900 text-white rounded-2xl rounded-br-md px-4 py-3"
              : "bg-stone-100 text-stone-800 rounded-2xl rounded-bl-md px-4 py-3"
          }`}
        >
          {/* Text */}
          {msg.text && (
            <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
          )}

          {/* Uploaded images */}
          {msg.imageUrls && msg.imageUrls.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {msg.imageUrls.map((url, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Analysis results */}
          {msg.analysis && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Type</p>
                <p className="text-xs font-medium text-stone-900">{msg.analysis.garmentType}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Style</p>
                <p className="text-xs font-medium text-stone-900">{msg.analysis.style}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Matiere</p>
                <p className="text-xs font-medium text-stone-900">{msg.analysis.material}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400">Couleur</p>
                <p className="text-xs font-medium text-stone-900">{msg.analysis.dominantColor}</p>
              </div>
              {msg.analysis.details && (
                <div className="col-span-2 bg-white rounded-lg p-2 border border-stone-200">
                  <p className="text-[10px] uppercase tracking-wide text-stone-400">Details</p>
                  <p className="text-xs text-stone-700">{msg.analysis.details}</p>
                </div>
              )}
            </div>
          )}

          {/* Generated text */}
          {msg.generatedText && (
            <div className="mt-3 space-y-2">
              <div className="bg-white rounded-lg p-3 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-1">Nom suggere</p>
                <p className="text-sm font-semibold text-stone-900">{msg.generatedText.name}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-stone-200">
                <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-1">Description</p>
                <p className="text-xs text-stone-700 leading-relaxed line-clamp-6">{msg.generatedText.description}</p>
              </div>
              {msg.generatedText.tags && msg.generatedText.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.generatedText.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated images */}
          {msg.generatedImages && msg.generatedImages.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {msg.generatedImages.map((url, i) => (
                <div key={i} className="aspect-[2/3] rounded-lg overflow-hidden border border-stone-200">
                  <img src={url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render interactive component at bottom ──
  const renderInteraction = () => {
    // Welcome: quick action button
    if (step === "welcome") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <button
            onClick={handleStartFlow}
            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Je veux ajouter un nouveau produit
          </button>
        </div>
      );
    }

    // Upload
    if (step === "upload") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />

          <div className="bg-stone-50 rounded-xl p-6 border-2 border-dashed border-stone-300">
            <div className="text-center">
              <p className="text-sm font-medium text-stone-700 mb-1">Photos du produit</p>
              <p className="text-xs text-stone-500 mb-4">
                Ajoutez jusqu&apos;a 6 photos. La premiere sera l&apos;image principale.
              </p>

              {/* Uploaded images preview */}
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 justify-center mb-4 flex-wrap">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-amber-400">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] text-center py-0.5 font-medium">
                          Principale
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Choisir une image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSkipUpload}
            className="w-full py-2.5 text-stone-500 text-sm hover:text-stone-700 transition-colors"
          >
            Passer cette etape
          </button>
        </div>
      );
    }

    // Analyzing / Generating / Creating: loading state
    if (step === "analyzing" || step === "generating" || step === "generating-images" || step === "creating") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
            <p className="text-sm text-stone-500">
              {step === "analyzing"
                ? "Analyse de l'image en cours..."
                : step === "generating-images"
                ? "Generation des images (30-60s)..."
                : step === "creating"
                ? "Creation du produit..."
                : "Generation en cours..."}
            </p>
          </div>
        </div>
      );
    }

    // Name input
    if (step === "name") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitText();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nom du produit (ou laisser vide)..."
              className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      );
    }

    // Category selection
    if (step === "category") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Categorie</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleSelectCategory(cat.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    category === cat.value
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Price input
    if (step === "price") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Prix (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="Ex: 75000"
                  min="0"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Prix promo (FCFA)
                </label>
                <input
                  type="number"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="Optionnel"
                  min="0"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-[10px] text-stone-400">La remise encourage les achats !</p>
            <button
              onClick={handleSubmitPrice}
              disabled={!basePrice || Number(basePrice) <= 0}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider le prix
            </button>
          </div>
        </div>
      );
    }

    // Sizes selection
    if (step === "sizes") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Tailles disponibles (optionnel)</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() =>
                    setSelectedSizes((prev) =>
                      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                    )
                  }
                  className={`w-12 h-12 flex items-center justify-center font-medium border-2 rounded-xl text-sm transition-all ${
                    selectedSizes.includes(size)
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmitSizes}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }

    // Stock
    if (step === "stock") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Gestion du stock</p>
              <button
                onClick={() => setHasStock(!hasStock)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  hasStock ? "bg-amber-500" : "bg-stone-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    hasStock ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {hasStock && (
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">
                  Quantite en stock
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Ex: 10"
                  min="0"
                  className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}

            <button
              onClick={handleSubmitStock}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }

    // Ask for image generation
    if (step === "ask-images") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white space-y-2">
          <button
            onClick={handleGenerateImages}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
            </svg>
            Oui, generer 3 images secondaires
          </button>
          <button
            onClick={handleSkipImages}
            className="w-full py-2.5 text-stone-500 text-sm hover:text-stone-700 transition-colors"
          >
            Non, passer cette etape
          </button>
        </div>
      );
    }

    // Done: publish button
    if (step === "done") {
      return (
        <div className="p-4 border-t border-stone-200 bg-white space-y-2">
          <button
            onClick={handleCreateProduct}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Publier le produit
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-stone-500 text-sm hover:text-stone-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">Assistant IA</h2>
              <p className="text-xs text-stone-500">Ibag Couture — Creation intelligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white min-h-0">
          {messages.map(renderMessage)}
          <div ref={chatEndRef} />
        </div>

        {/* Interaction Area */}
        {renderInteraction()}
      </div>
    </div>
  );
}
