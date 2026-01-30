"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromOrder, setFromOrder] = useState(false);

  // Pre-fill from URL params (after guest checkout)
  useEffect(() => {
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (email || name) {
      setFromOrder(true);
      setFormData((prev) => ({
        ...prev,
        email: email || prev.email,
        fullName: name || prev.fullName,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      // Store token and user info
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // Redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col pt-16 md:pt-20">
      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-serif text-stone-900 mb-2">
              Creer un compte
            </h1>
            <p className="text-stone-500">
              {fromOrder
                ? "Creez votre compte pour suivre votre commande"
                : "Rejoignez la maison Ibag Couture"}
            </p>
          </div>

          {/* Order Success Message */}
          {fromOrder && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-sm">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Votre commande a ete enregistree ! Creez un compte pour la suivre.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm text-stone-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                placeholder="Prénom Nom"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-stone-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm text-stone-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-stone-400">
                Minimum 6 caractères
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-stone-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 border-stone-300 rounded-sm focus:ring-stone-900"
              />
              <label htmlFor="terms" className="text-sm text-stone-600">
                J&apos;accepte les{" "}
                <a href="#" className="text-amber-700 hover:text-amber-800">
                  conditions générales
                </a>{" "}
                et la{" "}
                <a href="#" className="text-amber-700 hover:text-amber-800">
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white py-4 text-sm tracking-[0.2em] uppercase hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création en cours...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-stone-600">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-stone-500 text-sm hover:text-stone-900 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-100 py-6 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} Ibag Couture. Tous droits réservés.
          </p>
        </div>
      </footer>
    </main>
  );
}
