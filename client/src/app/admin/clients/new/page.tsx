"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MeasurementsForm, { emptyMeasurements, type Measurements } from "@/components/admin/MeasurementsForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [clientType, setClientType] = useState<"sur_place" | "en_ligne">("sur_place");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [showMeasurements, setShowMeasurements] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

      // Construire les mesures nettoyées
      const cleanMeasurements = showMeasurements ? {
        shoulders: measurements.shoulders || undefined,
        chest: measurements.chest || undefined,
        waist: measurements.waist || undefined,
        hips: measurements.hips || undefined,
        boubouLength: measurements.boubouLength || undefined,
        pantsLength: measurements.pantsLength || undefined,
        sleeveLength: measurements.sleeveLength || undefined,
        customMeasurements: measurements.customMeasurements
          .filter((m) => m.label && m.value !== "")
          .map((m) => ({ label: m.label, value: Number(m.value) })),
        notes: measurements.notes || undefined,
      } : undefined;

      const hasAnyMeasurement = cleanMeasurements && (
        cleanMeasurements.shoulders || cleanMeasurements.chest || cleanMeasurements.waist ||
        cleanMeasurements.hips || cleanMeasurements.boubouLength || cleanMeasurements.pantsLength ||
        cleanMeasurements.sleeveLength || (cleanMeasurements.customMeasurements && cleanMeasurements.customMeasurements.length > 0)
      );

      const body: Record<string, unknown> = {
        fullName,
        phone,
        clientType,
      };
      if (email) body.email = email;
      if (address) body.address = address;
      if (notes) body.notes = notes;
      if (hasAnyMeasurement) body.measurements = cleanMeasurements;

      const res = await fetch(`${API_URL}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Client créé avec succès !" });
        setTimeout(() => router.push("/admin/clients"), 1500);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.message || "Erreur lors de la création" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux clients
        </Link>
        <h1 className="text-2xl font-serif text-stone-900">Nouveau client</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
          <h2 className="text-lg font-medium text-stone-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Amadou Diallo"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +221 77 123 45 67"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: amadou@email.com"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Type de client</label>
              <div className="flex gap-3">
                {(["sur_place", "en_ligne"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClientType(type)}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      clientType === type
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {type === "sur_place" ? "Sur place" : "En ligne"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Adresse</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse du client"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Préférences, retouches fréquentes, urgence..."
                rows={3}
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Mesures */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-stone-900">Mesures personnalisées</h2>
            <button
              type="button"
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showMeasurements ? "bg-amber-500" : "bg-stone-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showMeasurements ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {showMeasurements ? (
            <MeasurementsForm measurements={measurements} onChange={setMeasurements} />
          ) : (
            <p className="text-sm text-stone-500">Activez pour saisir les mesures du client.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/clients"
            className="px-6 py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none px-8 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enregistrement...
              </span>
            ) : (
              "Enregistrer le client"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
