"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Option = {
  name: string;
  price: number;
  selected?: boolean;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  promoPrice?: number | null;
  category: string;
  description?: string;
  mainImage?: string;
  images?: string[];
  availableSizes?: string[];
  isCustomAvailable?: boolean;
  customPriceImpact?: number;
  options?: Option[];
  productionTime?: number;
};

type CustomerInfo = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
};

type Measurements = {
  shoulders: string;
  chest: string;
  waist: string;
  hips: string;
  garmentLength: string;
  notes: string;
};

type SizeOption = "S" | "M" | "L" | "XL" | "XXL" | "sur-mesure";

type OrderStep = "options" | "info" | "review" | "confirmation";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<OrderStep>("options");
  const [orderNumber, setOrderNumber] = useState("");

  // Selected options
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

  // Size selection
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);

  // Custom measurements (for "sur-mesure" option)
  const [measurements, setMeasurements] = useState<Measurements>({
    shoulders: "",
    chest: "",
    waist: "",
    hips: "",
    garmentLength: "",
    notes: "",
  });

  // Customer info
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });

  // Check if user is logged in
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);

  useEffect(() => {
    // Pre-fill from logged in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setCustomer((prev) => ({
        ...prev,
        fullName: parsed.fullName || "",
        email: parsed.email || "",
      }));
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error("Produit introuvable");
        }

        setProduct(data.data);

        // Auto-select sur-mesure if it's the only size option
        const prod = data.data;
        if (prod.isCustomAvailable && (!prod.availableSizes || prod.availableSizes.length === 0)) {
          setSelectedSize("sur-mesure");
        }

        // Initialize selected options
        if (data.data.options) {
          setSelectedOptions(
            data.data.options.map((opt: Option) => ({ ...opt, selected: false }))
          );
        }
      } catch {
        setError("Impossible de charger le produit");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Calculate total
  const originalPrice = product?.basePrice || 0;
  const hasPromo = product?.promoPrice != null && product.promoPrice > 0 && product.promoPrice < originalPrice;
  const basePrice = hasPromo ? product!.promoPrice! : originalPrice;
  const optionsTotal = selectedOptions
    .filter((opt) => opt.selected)
    .reduce((sum, opt) => sum + opt.price, 0);
  const customSurcharge = selectedSize === "sur-mesure" && product?.customPriceImpact ? product.customPriceImpact : 0;
  const totalPrice = basePrice + optionsTotal + customSurcharge;

  // Toggle option selection
  const toggleOption = (index: number) => {
    setSelectedOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, selected: !opt.selected } : opt))
    );
  };

  // Handle customer info change
  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  // Handle measurements change
  const handleMeasurementsChange = (field: keyof Measurements, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  // Validate step 1 - Size required if product has size options; measurements required if "sur-mesure"
  const hasSizeOptions = (product?.availableSizes && product.availableSizes.length > 0) || product?.isCustomAvailable;
  const canProceedToInfo =
    !hasSizeOptions || (
      selectedSize !== null &&
      (selectedSize !== "sur-mesure" || (
        measurements.shoulders.trim() !== "" &&
        measurements.chest.trim() !== "" &&
        measurements.waist.trim() !== "" &&
        measurements.hips.trim() !== ""
      ))
    );

  // Validate step 2
  const canSubmitOrder =
    customer.fullName.trim() !== "" &&
    customer.phone.trim() !== "" &&
    customer.email.trim() !== "" &&
    customer.email.includes("@");

  // Submit order
  const handleSubmit = async () => {
    if (!product || !canSubmitOrder) return;

    setSubmitting(true);
    setError("");

    try {
      const orderData = {
        product: product._id,
        selectedOptions: selectedOptions
          .filter((opt) => opt.selected)
          .map((opt) => ({ name: opt.name, price: opt.price })),
        size: selectedSize,
        measurements: selectedSize === "sur-mesure" ? {
          shoulders: measurements.shoulders,
          chest: measurements.chest,
          waist: measurements.waist,
          hips: measurements.hips,
          garmentLength: measurements.garmentLength || undefined,
          notes: measurements.notes || undefined,
        } : undefined,
        customer: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          city: customer.city || undefined,
          address: customer.address || undefined,
        },
        notes: customer.notes || undefined,
        basePrice: basePrice,
        originalPrice: originalPrice,
        optionsPrice: optionsTotal,
        totalPrice: totalPrice,
        isGuest: !user,
      };

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la commande");
      }

      setOrderNumber(data.data?.orderNumber || data.data?._id || "XXXX");
      setStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 pt-6 md:pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-stone-50 pt-6 md:pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/collections"
              className="text-amber-700 hover:text-amber-800 transition-colors"
            >
              Retour aux collections
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Confirmation step
  if (step === "confirmation") {
    return (
      <main className="min-h-screen bg-stone-50">
        {/* Header */}
        <div className="pt-6 md:pt-8 pb-8 bg-white border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-stone-400 mb-4">
              <Link href="/" className="hover:text-stone-900 transition-colors">
                Accueil
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-stone-900 font-medium">Confirmation</span>
            </nav>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-sm border border-stone-200 p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif text-stone-900 mb-4">
              Commande envoyee !
            </h1>

            <p className="text-stone-600 mb-2">
              Merci pour votre confiance. Votre commande a bien ete enregistree.
            </p>

            <p className="text-sm text-stone-500 mb-8">
              Reference : <span className="font-medium text-stone-900">#{orderNumber}</span>
            </p>

            {/* Order Summary */}
            <div className="bg-stone-50 rounded-sm p-6 mb-8 text-left">
              <h3 className="font-medium text-stone-900 mb-4">Recapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Produit</span>
                  <span className="text-stone-900">{product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Taille</span>
                  <span className="text-stone-900">
                    {selectedSize === "sur-mesure" ? "Sur mesure" : selectedSize}
                  </span>
                </div>
                {selectedSize === "sur-mesure" && (
                  <div className="pt-2 mt-2 border-t border-stone-200">
                    <p className="text-stone-500 text-xs mb-2">Mesures :</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-stone-500">Epaules: {measurements.shoulders} cm</span>
                      <span className="text-stone-500">Poitrine: {measurements.chest} cm</span>
                      <span className="text-stone-500">Taille: {measurements.waist} cm</span>
                      <span className="text-stone-500">Hanches: {measurements.hips} cm</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-2 border-t border-stone-200">
                  <span className="text-stone-600">Total</span>
                  <span className="font-medium text-stone-900">
                    {totalPrice.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-amber-50 border border-amber-100 rounded-sm p-6 mb-8 text-left">
              <h4 className="font-medium text-stone-900 mb-2">Prochaines etapes</h4>
              <ul className="text-sm text-stone-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">1.</span>
                  Notre equipe vous contactera sous 24h pour confirmer les details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">2.</span>
                  Nous verifierons vos mesures ensemble
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">3.</span>
                  La confection debutera apres validation du paiement
                </li>
              </ul>
            </div>

            {/* Actions */}
            {!user && (
              <div className="border-t border-stone-200 pt-8 mb-8">
                <p className="text-sm text-stone-500 mb-4">
                  Creez un compte pour suivre votre commande et sauvegarder vos mesures
                </p>
                <Link
                  href={`/register?email=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.fullName)}`}
                  className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm tracking-wide hover:bg-stone-800 transition-colors"
                >
                  Creer mon compte
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}

            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Continuer mes achats
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="pt-6 md:pt-8 pb-8 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-4">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Accueil
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/collections" className="hover:text-stone-900 transition-colors">
              Collections
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-stone-900 font-medium">Commander</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-serif text-stone-900">
            Finaliser votre commande
          </h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            {[
              { key: "options", label: "Options", num: 1 },
              { key: "info", label: "Coordonnees", num: 2 },
              { key: "review", label: "Verification", num: 3 },
              { key: "confirmation", label: "Confirmation", num: 4 },
            ].map((s, i) => {
              const stepOrder = ["options", "info", "review", "confirmation"];
              const currentIdx = stepOrder.indexOf(step);
              const thisIdx = stepOrder.indexOf(s.key);
              const isActive = step === s.key;
              const isDone = thisIdx < currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  {i > 0 && <div className={`w-8 sm:w-12 h-px ${isDone ? "bg-stone-900" : "bg-stone-200"}`} />}
                  <div className={`flex items-center gap-2 ${isActive ? "text-stone-900" : isDone ? "text-stone-600" : "text-stone-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive ? "bg-stone-900 text-white" : isDone ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-500"
                    }`}>
                      {isDone ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : s.num}
                    </div>
                    <span className="hidden sm:inline text-sm">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Step 1: Size & Options */}
            {step === "options" && (
              <div className="space-y-6">
                {/* Size Selection - only show if product has sizes or sur-mesure */}
                {hasSizeOptions && <div className="bg-white rounded-sm border border-stone-200">
                  <div className="px-6 py-4 border-b border-stone-200">
                    <h2 className="font-medium text-stone-900">Choisir votre taille</h2>
                    <p className="text-sm text-stone-500 mt-1">
                      {product?.availableSizes && product.availableSizes.length > 0 && product?.isCustomAvailable
                        ? "Selectionnez une taille standard ou optez pour du sur mesure"
                        : product?.isCustomAvailable
                          ? "Ce modele est disponible en sur-mesure uniquement"
                          : "Selectionnez votre taille"}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Standard Sizes - Dynamic from product */}
                    {product?.availableSizes && product.availableSizes.length > 0 && (
                      <div className={product?.isCustomAvailable ? "mb-6" : ""}>
                        <label className="block text-sm font-medium text-stone-700 mb-3">
                          Tailles disponibles
                        </label>
                        <div className={`grid gap-3 ${product.availableSizes.length <= 3 ? "grid-cols-3" : product.availableSizes.length <= 5 ? "grid-cols-5" : "grid-cols-4"}`}>
                          {product.availableSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size as SizeOption)}
                              className={`py-4 text-center font-medium border transition-all ${
                                selectedSize === size
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-stone-200 text-stone-700 hover:border-stone-300"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sur Mesure Option - Only if product allows it */}
                    {product?.isCustomAvailable && (
                      <div className={product?.availableSizes && product.availableSizes.length > 0 ? "pt-6 border-t border-stone-200" : ""}>
                        <button
                          type="button"
                          onClick={() => setSelectedSize("sur-mesure")}
                          className={`w-full p-5 text-left border transition-all ${
                            selectedSize === "sur-mesure"
                              ? "border-amber-500 bg-amber-50"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedSize === "sur-mesure"
                                  ? "border-amber-500"
                                  : "border-stone-300"
                              }`}>
                                {selectedSize === "sur-mesure" && (
                                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                                )}
                              </div>
                              <div>
                                <span className="font-medium text-stone-900">Sur mesure</span>
                                <p className="text-sm text-stone-500 mt-0.5">
                                  Creation adaptee a vos mesures exactes
                                  {product.customPriceImpact && product.customPriceImpact > 0
                                    ? ` (+${product.customPriceImpact.toLocaleString("fr-FR")} FCFA)`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                              Recommande
                            </span>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Measurements Form - Only visible when "sur-mesure" selected */}
                    {selectedSize === "sur-mesure" && (
                      <div className="mt-6 p-6 bg-stone-50 border border-stone-200 rounded-sm animate-fadeIn">
                        {/* Reassuring Header */}
                        <div className="flex items-start gap-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Vos mesures sont entre de bonnes mains</h4>
                            <p className="text-sm text-green-700">
                              Notre equipe de couturiers experts verifiera vos mesures avec vous par telephone avant de commencer la confection. Pas d&apos;inquietude si vous n&apos;etes pas sur !
                            </p>
                          </div>
                        </div>

                        <h3 className="font-medium text-stone-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                          </svg>
                          Vos mesures
                        </h3>
                        <p className="text-sm text-stone-500 mb-6">
                          Toutes les mesures sont en centimetres (cm). Les champs marques * sont obligatoires.
                        </p>

                        {/* Visual Guide */}
                        <div className="mb-6 p-4 bg-white border border-stone-200 rounded-lg">
                          <p className="text-xs font-medium text-stone-700 uppercase tracking-wide mb-3">Guide de mesure</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-stone-50 rounded-lg">
                              <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 8v4M20 8v4" />
                                  <circle cx="12" cy="6" r="2" strokeWidth={1.5} />
                                </svg>
                              </div>
                              <p className="text-xs font-medium text-stone-900">Epaules</p>
                              <p className="text-xs text-stone-500">D&apos;epaule a epaule</p>
                            </div>
                            <div className="p-3 bg-stone-50 rounded-lg">
                              <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <ellipse cx="12" cy="12" rx="6" ry="4" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M12 8v8" />
                                </svg>
                              </div>
                              <p className="text-xs font-medium text-stone-900">Poitrine</p>
                              <p className="text-xs text-stone-500">Tour complet</p>
                            </div>
                            <div className="p-3 bg-stone-50 rounded-lg">
                              <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <ellipse cx="12" cy="12" rx="4" ry="3" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M8 12h8" />
                                </svg>
                              </div>
                              <p className="text-xs font-medium text-stone-900">Taille</p>
                              <p className="text-xs text-stone-500">Au creux naturel</p>
                            </div>
                            <div className="p-3 bg-stone-50 rounded-lg">
                              <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <ellipse cx="12" cy="14" rx="6" ry="4" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M6 14v4M18 14v4" />
                                </svg>
                              </div>
                              <p className="text-xs font-medium text-stone-900">Hanches</p>
                              <p className="text-xs text-stone-500">Partie la plus large</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Shoulders */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Epaules <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="20"
                                max="100"
                                value={measurements.shoulders}
                                onChange={(e) => handleMeasurementsChange("shoulders", e.target.value)}
                                placeholder="Ex: 45"
                                className={`w-full px-4 py-3 pr-16 border bg-white text-stone-900 placeholder-stone-400 focus:outline-none transition-colors rounded-lg ${
                                  measurements.shoulders.trim()
                                    ? "border-green-400 focus:border-green-500"
                                    : "border-stone-300 focus:border-stone-900"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm flex items-center gap-1">
                                cm
                                {measurements.shoulders.trim() && (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Chest */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Poitrine <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="50"
                                max="200"
                                value={measurements.chest}
                                onChange={(e) => handleMeasurementsChange("chest", e.target.value)}
                                placeholder="Ex: 95"
                                className={`w-full px-4 py-3 pr-16 border bg-white text-stone-900 placeholder-stone-400 focus:outline-none transition-colors rounded-lg ${
                                  measurements.chest.trim()
                                    ? "border-green-400 focus:border-green-500"
                                    : "border-stone-300 focus:border-stone-900"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm flex items-center gap-1">
                                cm
                                {measurements.chest.trim() && (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Waist */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Taille <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="40"
                                max="180"
                                value={measurements.waist}
                                onChange={(e) => handleMeasurementsChange("waist", e.target.value)}
                                placeholder="Ex: 80"
                                className={`w-full px-4 py-3 pr-16 border bg-white text-stone-900 placeholder-stone-400 focus:outline-none transition-colors rounded-lg ${
                                  measurements.waist.trim()
                                    ? "border-green-400 focus:border-green-500"
                                    : "border-stone-300 focus:border-stone-900"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm flex items-center gap-1">
                                cm
                                {measurements.waist.trim() && (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Hips */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Hanches <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="50"
                                max="200"
                                value={measurements.hips}
                                onChange={(e) => handleMeasurementsChange("hips", e.target.value)}
                                placeholder="Ex: 100"
                                className={`w-full px-4 py-3 pr-16 border bg-white text-stone-900 placeholder-stone-400 focus:outline-none transition-colors rounded-lg ${
                                  measurements.hips.trim()
                                    ? "border-green-400 focus:border-green-500"
                                    : "border-stone-300 focus:border-stone-900"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm flex items-center gap-1">
                                cm
                                {measurements.hips.trim() && (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Garment Length */}
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Longueur vetement <span className="text-stone-400 text-xs font-normal">(optionnel)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="30"
                                max="200"
                                value={measurements.garmentLength}
                                onChange={(e) => handleMeasurementsChange("garmentLength", e.target.value)}
                                placeholder="Ex: 70"
                                className={`w-full px-4 py-3 pr-16 border bg-white text-stone-900 placeholder-stone-400 focus:outline-none transition-colors rounded-lg ${
                                  measurements.garmentLength.trim()
                                    ? "border-green-400 focus:border-green-500"
                                    : "border-stone-300 focus:border-stone-900"
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm flex items-center gap-1">
                                cm
                                {measurements.garmentLength.trim() && (
                                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Notes <span className="text-stone-400 text-xs font-normal">(optionnel)</span>
                            </label>
                            <textarea
                              value={measurements.notes}
                              onChange={(e) => handleMeasurementsChange("notes", e.target.value)}
                              placeholder="Precisions supplementaires sur vos mesures ou preferences... Ex: Je prefere une coupe ample, j'ai les epaules larges..."
                              rows={3}
                              className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-4 p-3 bg-white border border-stone-200 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-600">Progression des mesures</span>
                            <span className={`font-medium ${
                              measurements.shoulders.trim() && measurements.chest.trim() && measurements.waist.trim() && measurements.hips.trim()
                                ? "text-green-600"
                                : "text-stone-500"
                            }`}>
                              {[measurements.shoulders, measurements.chest, measurements.waist, measurements.hips].filter(m => m.trim()).length}/4 obligatoires
                            </span>
                          </div>
                          <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-300"
                              style={{
                                width: `${([measurements.shoulders, measurements.chest, measurements.waist, measurements.hips].filter(m => m.trim()).length / 4) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Help Tips */}
                        <div className="mt-6 space-y-3">
                          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                            <div className="flex gap-3">
                              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-stone-900 mb-1">Conseils pour bien mesurer</p>
                                <ul className="text-sm text-stone-600 space-y-1">
                                  <li>• Faites-vous aider par une autre personne</li>
                                  <li>• Utilisez un metre ruban souple</li>
                                  <li>• Tenez-vous droit, bras le long du corps</li>
                                  <li>• Ne serrez pas trop le metre ruban</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex gap-3">
                              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-blue-900 mb-1">Besoin d&apos;aide ?</p>
                                <p className="text-sm text-blue-700">
                                  Notre equipe vous contactera sous 24h pour verifier vos mesures ensemble par telephone ou video. Aucun risque d&apos;erreur !
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>}

                {/* No size options - legacy products */}
                {!hasSizeOptions && (
                  <div className="bg-white rounded-sm border border-stone-200 p-6">
                    <p className="text-sm text-stone-500">
                      Ce produit n&apos;a pas de configuration de taille. Vous pouvez continuer directement.
                    </p>
                  </div>
                )}

                {/* Product Options */}
                {selectedOptions.length > 0 && (
                  <div className="bg-white rounded-sm border border-stone-200">
                    <div className="px-6 py-4 border-b border-stone-200">
                      <h2 className="font-medium text-stone-900">Options personnalisees</h2>
                      <p className="text-sm text-stone-500 mt-1">
                        Selectionnez les options souhaitees pour votre creation
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3">
                        {selectedOptions.map((option, index) => (
                          <label
                            key={index}
                            className={`flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all ${
                              option.selected
                                ? "border-amber-500 bg-amber-50"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={option.selected || false}
                                onChange={() => toggleOption(index)}
                                className="w-5 h-5 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
                              />
                              <span className="text-stone-900">{option.name}</span>
                            </div>
                            <span className="text-stone-600 font-medium">
                              +{option.price.toLocaleString("fr-FR")} FCFA
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep("info")}
                    disabled={!canProceedToInfo}
                    className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm tracking-wide hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Continuer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Info */}
            {step === "info" && (
              <div className="bg-white rounded-sm border border-stone-200">
                <div className="px-6 py-4 border-b border-stone-200">
                  <h2 className="font-medium text-stone-900">Vos coordonnees</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Ces informations nous permettront de vous contacter
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.fullName}
                      onChange={(e) => handleCustomerChange("fullName", e.target.value)}
                      placeholder="Prenom Nom"
                      className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Telephone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) => handleCustomerChange("phone", e.target.value)}
                        placeholder="+221 77 000 00 00"
                        className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => handleCustomerChange("email", e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* City & Address */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={customer.city}
                        onChange={(e) => handleCustomerChange("city", e.target.value)}
                        placeholder="Dakar"
                        className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        value={customer.address}
                        onChange={(e) => handleCustomerChange("address", e.target.value)}
                        placeholder="Quartier, rue..."
                        className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Message ou notes
                    </label>
                    <textarea
                      value={customer.notes}
                      onChange={(e) => handleCustomerChange("notes", e.target.value)}
                      placeholder="Informations supplementaires, preferences particulieres..."
                      rows={4}
                      className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => setStep("options")}
                      className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-6 py-3 text-sm tracking-wide hover:bg-stone-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                      Retour
                    </button>
                    <button
                      onClick={() => setStep("review")}
                      disabled={!canSubmitOrder}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-8 py-3 text-sm tracking-wide hover:bg-stone-800 disabled:bg-stone-300 transition-colors"
                    >
                      Verifier ma commande
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === "review" && (
              <div className="space-y-6">
                <div className="bg-white rounded-sm border border-stone-200">
                  <div className="px-6 py-4 border-b border-stone-200">
                    <h2 className="font-medium text-stone-900">Verification de votre commande</h2>
                    <p className="text-sm text-stone-500 mt-1">
                      Verifiez que toutes les informations sont correctes avant de confirmer
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Product */}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Produit</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-stone-900">{product?.name}</p>
                          <p className="text-sm text-stone-500">{product?.category}</p>
                        </div>
                        {hasPromo ? (
                          <p>
                            <span className="font-medium text-red-700">{basePrice.toLocaleString("fr-FR")} FCFA</span>
                            <span className="ml-1.5 text-stone-400 line-through text-xs">{originalPrice.toLocaleString("fr-FR")}</span>
                          </p>
                        ) : (
                          <p className="font-medium text-stone-900">{basePrice.toLocaleString("fr-FR")} FCFA</p>
                        )}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Taille</p>
                      <p className={`font-medium ${selectedSize === "sur-mesure" ? "text-amber-700" : "text-stone-900"}`}>
                        {selectedSize === "sur-mesure" ? "Sur mesure" : selectedSize}
                      </p>
                    </div>

                    {/* Measurements */}
                    {selectedSize === "sur-mesure" && (
                      <div className="pt-4 border-t border-stone-100">
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Mesures</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-stone-500">Epaules</p>
                            <p className="text-lg font-bold text-stone-900">{measurements.shoulders} <span className="text-xs font-normal">cm</span></p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-stone-500">Poitrine</p>
                            <p className="text-lg font-bold text-stone-900">{measurements.chest} <span className="text-xs font-normal">cm</span></p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-stone-500">Taille</p>
                            <p className="text-lg font-bold text-stone-900">{measurements.waist} <span className="text-xs font-normal">cm</span></p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-stone-500">Hanches</p>
                            <p className="text-lg font-bold text-stone-900">{measurements.hips} <span className="text-xs font-normal">cm</span></p>
                          </div>
                        </div>
                        {measurements.garmentLength && (
                          <p className="text-sm text-stone-600 mt-2">Longueur : {measurements.garmentLength} cm</p>
                        )}
                        {measurements.notes && (
                          <p className="text-sm text-stone-500 mt-2 italic">&quot;{measurements.notes}&quot;</p>
                        )}
                      </div>
                    )}

                    {/* Options */}
                    {selectedOptions.filter((o) => o.selected).length > 0 && (
                      <div className="pt-4 border-t border-stone-100">
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Options selectionnees</p>
                        <div className="space-y-2">
                          {selectedOptions.filter((o) => o.selected).map((opt, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-stone-700 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {opt.name}
                              </span>
                              <span className="text-stone-900 font-medium">+{opt.price.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Coordonnees</p>
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-stone-500">Nom : </span>
                          <span className="text-stone-900 font-medium">{customer.fullName}</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Tel : </span>
                          <span className="text-stone-900 font-medium">{customer.phone}</span>
                        </div>
                        <div>
                          <span className="text-stone-500">Email : </span>
                          <span className="text-stone-900 font-medium">{customer.email}</span>
                        </div>
                        {customer.city && (
                          <div>
                            <span className="text-stone-500">Ville : </span>
                            <span className="text-stone-900">{customer.city}</span>
                          </div>
                        )}
                      </div>
                      {customer.notes && (
                        <p className="text-sm text-stone-500 mt-3 italic">&quot;{customer.notes}&quot;</p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-stone-200 bg-stone-50 -mx-6 -mb-6 p-6 rounded-b-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-stone-900">Total a payer</span>
                        <span className="text-2xl font-serif text-stone-900">
                          {totalPrice.toLocaleString("fr-FR")} <span className="text-sm">FCFA</span>
                        </span>
                      </div>
                      {product?.productionTime && (
                        <p className="text-xs text-stone-500 mt-2">
                          Delai de confection estime : {product.productionTime} jours ouvrables
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setStep("info")}
                    className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-6 py-3 text-sm tracking-wide hover:bg-stone-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Modifier
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-8 py-3 text-sm tracking-wide hover:bg-stone-800 disabled:bg-stone-300 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Confirmer la commande
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-sm border border-stone-200 p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className="text-xs text-stone-500">Donnees securisees</p>
              </div>
              <div className="bg-white rounded-sm border border-stone-200 p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-xs text-stone-500">Fait main</p>
              </div>
              <div className="bg-white rounded-sm border border-stone-200 p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-stone-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <p className="text-xs text-stone-500">Support 24/7</p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-sm border border-stone-200 sticky top-24">
              <div className="px-6 py-4 border-b border-stone-200">
                <h3 className="font-medium text-stone-900">Recapitulatif</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-gradient-to-br from-stone-100 to-stone-200 flex-shrink-0 overflow-hidden">
                    {(product?.mainImage || (product?.images && product.images.length > 0)) ? (
                      <img
                        src={(() => {
                          const imgUrl = product?.mainImage || product?.images![0];
                          if (!imgUrl) return "";
                          if (imgUrl.startsWith("http")) return imgUrl;
                          return `${API_URL}${imgUrl}`;
                        })()}
                        alt={product?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">
                      {product?.category}
                    </p>
                    <h4 className="font-serif text-stone-900">{product?.name}</h4>
                    {selectedSize && (
                      <p className="text-xs text-stone-500 mt-1">
                        Taille : <span className="font-medium text-stone-700">{selectedSize === "sur-mesure" ? "Sur mesure" : selectedSize}</span>
                      </p>
                    )}
                    {product?.productionTime && (
                      <p className="text-xs text-stone-500 mt-1">
                        Confection : {product.productionTime} jours
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-stone-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Prix de base</span>
                    {hasPromo ? (
                      <span>
                        <span className="text-red-700 font-medium">{basePrice.toLocaleString("fr-FR")} FCFA</span>
                        <span className="ml-1.5 text-stone-400 line-through text-xs">{originalPrice.toLocaleString("fr-FR")}</span>
                      </span>
                    ) : (
                      <span className="text-stone-900">{basePrice.toLocaleString("fr-FR")} FCFA</span>
                    )}
                  </div>

                  {customSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Supplement sur-mesure</span>
                      <span className="text-stone-900">
                        +{customSurcharge.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}

                  {selectedOptions.filter((opt) => opt.selected).length > 0 && (
                    <>
                      <div className="text-xs text-stone-500 uppercase tracking-wide pt-2">
                        Options selectionnees
                      </div>
                      {selectedOptions
                        .filter((opt) => opt.selected)
                        .map((opt, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-stone-600">{opt.name}</span>
                            <span className="text-stone-900">
                              +{opt.price.toLocaleString("fr-FR")} FCFA
                            </span>
                          </div>
                        ))}
                    </>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-stone-900">Total</span>
                    <span className="text-2xl font-serif text-stone-900">
                      {totalPrice.toLocaleString("fr-FR")} <span className="text-sm">FCFA</span>
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-amber-50 border border-amber-100 rounded-sm p-4">
                  <p className="text-xs text-stone-600">
                    <strong className="text-stone-900">Note :</strong> Le paiement sera confirme
                    apres validation de vos mesures avec notre equipe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
