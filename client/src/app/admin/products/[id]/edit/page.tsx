"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import MultiImageUpload from "@/components/admin/MultiImageUpload";
import AIProductModal from "@/components/admin/AIProductModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ProductOption = {
  name: string;
  price: number;
};

type ProductForm = {
  name: string;
  category: string;
  basePrice: string;
  description: string;
  productionTime: string;
  isActive: boolean;
  mainImage: string;
  images: string[];
  availableSizes: string[];
  isCustomAvailable: boolean;
  customPriceImpact: string;
  options: ProductOption[];
  hasStock: boolean;
  stockQuantity: string;
  promoPrice: string;
};

const categories = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "traditionnel", label: "Traditionnel" },
  { value: "moderne", label: "Moderne" },
];

const ALL_SIZES = ["S", "M", "L", "XL", "XXL"];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/admin/products");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const [showAI, setShowAI] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: "",
    basePrice: "",
    description: "",
    productionTime: "7",
    isActive: true,
    mainImage: "",
    images: [],
    availableSizes: [],
    isCustomAvailable: false,
    customPriceImpact: "0",
    options: [],
    hasStock: false,
    stockQuantity: "",
    promoPrice: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products?limit=1000`);
        const data = await res.json();

        if (data.success && data.data) {
          const product = data.data.find((p: { _id: string }) => p._id === productId);

          if (product) {
            setForm({
              name: product.name || "",
              category: product.category || "",
              basePrice: product.basePrice?.toString() || "",
              description: product.description || "",
              productionTime: product.productionTime?.toString() || "7",
              isActive: product.isActive ?? true,
              mainImage: product.mainImage || (product.images?.[0] || ""),
              images: product.images || [],
              availableSizes: product.availableSizes || [],
              isCustomAvailable: product.isCustomAvailable ?? false,
              customPriceImpact: product.customPriceImpact?.toString() || "0",
              options: product.options || [],
              hasStock: product.hasStock ?? false,
              stockQuantity: product.stockQuantity != null ? product.stockQuantity.toString() : "",
              promoPrice: product.promoPrice != null ? product.promoPrice.toString() : "",
            });
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Erreur lors du chargement du produit");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size],
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { name: "", price: 0 }],
    }));
  };

  const updateOption = (index: number, field: keyof ProductOption, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: form.name,
        category: form.category,
        basePrice: parseFloat(form.basePrice),
        description: form.description || undefined,
        productionTime: parseInt(form.productionTime) || 7,
        isActive: form.isActive,
        mainImage: form.mainImage || undefined,
        images: form.images,
        availableSizes: form.availableSizes,
        isCustomAvailable: form.isCustomAvailable,
        customPriceImpact: form.isCustomAvailable ? parseFloat(form.customPriceImpact) || 0 : 0,
        options: form.options.length > 0
          ? form.options.filter(o => o.name.trim()).map(o => ({
              name: o.name,
              price: typeof o.price === 'string' ? parseFloat(o.price) : o.price
            }))
          : [],
        hasStock: form.hasStock,
        stockQuantity: form.hasStock ? parseInt(form.stockQuantity) || 0 : null,
        promoPrice: form.promoPrice ? parseFloat(form.promoPrice) : null,
      };

      const res = await fetch(`${API_URL}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Erreur lors de la mise a jour du produit");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-stone-900 mb-2">Produit introuvable</h2>
          <p className="text-stone-500 mb-6">Le produit que vous recherchez n&apos;existe pas ou a ete supprime.</p>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm">Retour aux produits</span>
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif text-stone-900">
          Modifier le produit
        </h1>
        <p className="text-stone-500 mt-1 text-sm sm:text-base">
          Mettez a jour les informations de votre creation
        </p>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Modifications enregistrees!</p>
              <p className="text-sm text-green-100">Redirection en cours...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-700 font-medium">Erreur</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Informations de base
            </h2>
            <button
              type="button"
              onClick={() => setShowAI(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generer avec IA
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Ex: Grand Boubou Bazin"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Categorie <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">Selectionnez une categorie</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Prix de base (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="basePrice"
                value={form.basePrice}
                onChange={handleChange}
                required
                min="0"
                placeholder="Ex: 75000"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Temps de confection (jours)
              </label>
              <input
                type="number"
                name="productionTime"
                value={form.productionTime}
                onChange={handleChange}
                min="1"
                placeholder="7"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-stone-700">
                Produit actif (visible sur le site)
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Decrivez votre creation..."
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Photos du produit
          </h2>
          <p className="text-sm text-stone-500 mb-4">
            Uploadez jusqu&apos;a 6 images (JPG, PNG ou WebP, max 5MB chacune). La premiere sera l&apos;image principale.
          </p>

          <MultiImageUpload
            mainImage={form.mainImage}
            images={form.images}
            onMainImageChange={(url) => setForm((prev) => ({ ...prev, mainImage: url }))}
            onImagesChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
          />
        </div>

        {/* Sizes & Sur-mesure Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
            Tailles et sur-mesure
          </h2>

          {/* Available Sizes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Tailles disponibles
            </label>
            <div className="flex flex-wrap gap-3">
              {ALL_SIZES.map((size) => {
                const isSelected = form.availableSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`w-14 h-14 flex items-center justify-center font-medium border-2 rounded-xl transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Cochez les tailles que vous proposez pour ce produit. Le client ne verra que les tailles selectionnees.
            </p>
          </div>

          {/* Sur-mesure Toggle */}
          <div className="pt-6 border-t border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Proposer le sur-mesure
                </label>
                <p className="text-xs text-stone-400 mt-0.5">
                  Le client pourra fournir ses mesures personnalisees
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isCustomAvailable: !prev.isCustomAvailable }))}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  form.isCustomAvailable ? "bg-amber-500" : "bg-stone-300"
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  form.isCustomAvailable ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {form.isCustomAvailable && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Supplement sur-mesure (FCFA)
                </label>
                <input
                  type="number"
                  name="customPriceImpact"
                  value={form.customPriceImpact}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                  className="w-full sm:w-48 px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
                />
                <p className="text-xs text-stone-500 mt-2">
                  Montant supplementaire ajoute au prix de base pour une commande sur-mesure. Mettez 0 si pas de supplement.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Options Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Options supplementaires
            </h2>
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors rounded-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter une option
            </button>
          </div>

          <div className="space-y-3">
            {form.options.map((option, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-stone-50 rounded-xl">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => updateOption(index, "name", e.target.value)}
                  placeholder="Nom de l'option (ex: Broderie doree)"
                  className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={option.price}
                    onChange={(e) => updateOption(index, "price", e.target.value)}
                    placeholder="Prix"
                    min="0"
                    className="w-full sm:w-32 px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {form.options.length === 0 && (
              <p className="text-sm text-stone-500 text-center py-4">
                Aucune option ajoutee. Les options permettent de proposer des personnalisations (broderie, tissu premium, etc.)
              </p>
            )}
          </div>
        </div>

        {/* Stock & Promo Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Stock et promotion
          </h2>

          {/* Stock Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Gestion du stock
              </label>
              <p className="text-xs text-stone-400 mt-0.5">
                Activez pour suivre la quantite disponible
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, hasStock: !prev.hasStock }))}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                form.hasStock ? "bg-amber-500" : "bg-stone-300"
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                form.hasStock ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {form.hasStock && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Quantite en stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                min="0"
                placeholder="Ex: 5"
                required
                className="w-full sm:w-48 px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
              />
              <p className="text-xs text-stone-500 mt-2">
                Si la quantite atteint 0, le produit sera affiche comme &quot;Rupture de stock&quot; sur le site.
              </p>
            </div>
          )}

          {/* Promo Price */}
          <div className="pt-6 border-t border-stone-200">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Prix promotionnel (FCFA)
            </label>
            <input
              type="number"
              name="promoPrice"
              value={form.promoPrice}
              onChange={handleChange}
              min="0"
              placeholder="Laisser vide si pas de promotion"
              className="w-full sm:w-64 px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
            {form.promoPrice && form.basePrice && parseFloat(form.promoPrice) >= parseFloat(form.basePrice) && (
              <p className="text-xs text-red-500 mt-2">
                Le prix promotionnel doit etre inferieur au prix de base ({parseFloat(form.basePrice).toLocaleString("fr-FR")} FCFA).
              </p>
            )}
            {form.promoPrice && form.basePrice && parseFloat(form.promoPrice) < parseFloat(form.basePrice) && (
              <p className="text-xs text-green-600 mt-2">
                Reduction de {Math.round((1 - parseFloat(form.promoPrice) / parseFloat(form.basePrice)) * 100)}% affichee sur le site.
              </p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              Laissez vide pour ne pas appliquer de promotion.
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Link
            href="/admin/products"
            className="px-6 py-3 text-center border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 transition-colors rounded-xl"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Enregistrement...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Modal */}
      {showAI && (
        <AIProductModal
          currentName={form.name}
          currentCategory={form.category}
          currentPrice={form.basePrice}
          isCustomAvailable={form.isCustomAvailable}
          referenceImageUrl={form.mainImage || undefined}
          onApply={(result) => {
            setForm((prev) => ({
              ...prev,
              ...(result.name ? { name: result.name } : {}),
              ...(result.description ? { description: result.description } : {}),
              ...(result.mainImage ? { mainImage: result.mainImage } : {}),
              ...(result.images ? { images: [...prev.images, ...result.images] } : {}),
            }));
            setShowAI(false);
          }}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
