"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import MeasurementsForm, { emptyMeasurements, type Measurements } from "@/components/admin/MeasurementsForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [clientType, setClientType] = useState<"sur_place" | "en_ligne">("sur_place");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Commandes liées
  const [orders, setOrders] = useState<Array<{ _id: string; orderNumber?: string; totalPrice: number; status: string; createdAt: string; product?: { name: string } }>>([]);

  useEffect(() => {
    fetchClient();
    fetchOrders();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const { data } = await res.json();
      setFullName(data.fullName || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setClientType(data.clientType || "sur_place");
      setAddress(data.address || "");
      setNotes(data.notes || "");

      if (data.measurements) {
        setShowMeasurements(true);
        setMeasurements({
          shoulders: data.measurements.shoulders || "",
          chest: data.measurements.chest || "",
          waist: data.measurements.waist || "",
          hips: data.measurements.hips || "",
          boubouLength: data.measurements.boubouLength || "",
          pantsLength: data.measurements.pantsLength || "",
          sleeveLength: data.measurements.sleeveLength || "",
          customMeasurements: data.measurements.customMeasurements || [],
          notes: data.measurements.notes || "",
        });
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/clients/${clientId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { data } = await res.json();
        setOrders(data || []);
      }
    } catch {
      // silent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");

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
      } : null;

      const hasAnyMeasurement = cleanMeasurements && (
        cleanMeasurements.shoulders || cleanMeasurements.chest || cleanMeasurements.waist ||
        cleanMeasurements.hips || cleanMeasurements.boubouLength || cleanMeasurements.pantsLength ||
        cleanMeasurements.sleeveLength || (cleanMeasurements.customMeasurements && cleanMeasurements.customMeasurements.length > 0)
      );

      const body: Record<string, unknown> = {
        fullName,
        phone,
        email: email || undefined,
        clientType,
        address: address || undefined,
        notes: notes || undefined,
        measurements: hasAnyMeasurement ? cleanMeasurements : null,
      };

      const res = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Modifications enregistrées !" });
        setTimeout(() => router.push("/admin/clients"), 1500);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.message || "Erreur lors de la modification" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
    } finally {
      setSaving(false);
    }
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
    in_production: { label: "En confection", className: "bg-purple-100 text-purple-700" },
    ready: { label: "Prêt", className: "bg-blue-100 text-blue-700" },
    delivered: { label: "Livré", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-stone-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-medium text-stone-900 mb-2">Client introuvable</h2>
        <p className="text-stone-500 mb-4">Ce client n&apos;existe pas ou a été supprimé.</p>
        <Link href="/admin/clients" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
          Retour aux clients
        </Link>
      </div>
    );
  }

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
        <h1 className="text-2xl font-serif text-stone-900">Modifier le client</h1>
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
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <p className="text-sm text-stone-500">Activez pour modifier les mesures du client.</p>
          )}
        </div>

        {/* Commandes liées */}
        {orders.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
            <h2 className="text-lg font-medium text-stone-900 mb-4">
              Commandes ({orders.length})
            </h2>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-stone-500">
                      {order.product?.name} — {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[order.status]?.className || "bg-stone-100 text-stone-600"}`}>
                      {statusLabels[order.status]?.label || order.status}
                    </span>
                    <span className="text-sm font-medium text-stone-900">
                      {order.totalPrice.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              "Enregistrer les modifications"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
