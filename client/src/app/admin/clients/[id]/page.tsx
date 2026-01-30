"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type CustomMeasurement = {
  label: string;
  value: number;
};

type ClientMeasurements = {
  shoulders?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  boubouLength?: number;
  pantsLength?: number;
  sleeveLength?: number;
  customMeasurements?: CustomMeasurement[];
  notes?: string;
};

type Client = {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  clientType: "sur_place" | "en_ligne";
  address?: string;
  notes?: string;
  measurements?: ClientMeasurements | null;
  createdAt: string;
  updatedAt?: string;
};

type ClientOrder = {
  _id: string;
  orderNumber?: string;
  totalPrice: number;
  amountPaid: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  product?: { name: string; slug?: string; category?: string; productionTime?: number };
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  in_production: { label: "En confection", className: "bg-purple-100 text-purple-700" },
  ready: { label: "Prêt", className: "bg-blue-100 text-blue-700" },
  delivered: { label: "Livré", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulé", className: "bg-red-100 text-red-700" },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  non_paye: { label: "Non payé", className: "bg-red-100 text-red-600" },
  unpaid: { label: "Non payé", className: "bg-red-100 text-red-600" },
  acompte: { label: "Acompte", className: "bg-amber-100 text-amber-700" },
  paye: { label: "Payé", className: "bg-green-100 text-green-700" },
  paid: { label: "Payé", className: "bg-green-100 text-green-700" },
  rembourse: { label: "Remboursé", className: "bg-stone-200 text-stone-600" },
  refunded: { label: "Remboursé", className: "bg-stone-200 text-stone-600" },
};

const MEASUREMENT_LABELS: Record<string, string> = {
  shoulders: "Épaules",
  chest: "Poitrine",
  waist: "Taille",
  hips: "Hanches",
  boubouLength: "Longueur boubou",
  pantsLength: "Longueur pantalon",
  sleeveLength: "Longueur manches",
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      setClient(data);
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

  // Finance calculations
  const totalDue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const totalRemaining = totalDue - totalPaid;

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/exports/clients?format=xlsx&clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `client-${client?.fullName?.replace(/\s+/g, "_") || clientId}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    }
  };

  // Measurements helpers
  const hasMeasurements = client?.measurements && (
    client.measurements.shoulders ||
    client.measurements.chest ||
    client.measurements.waist ||
    client.measurements.hips ||
    client.measurements.boubouLength ||
    client.measurements.pantsLength ||
    client.measurements.sleeveLength ||
    (client.measurements.customMeasurements && client.measurements.customMeasurements.length > 0)
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
          <div className="h-8 w-56 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-stone-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-stone-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <h2 className="text-xl font-medium text-stone-900 mb-2">Client introuvable</h2>
        <p className="text-stone-500 mb-4">Ce client n&apos;existe pas ou a été supprimé.</p>
        <Link href="/admin/clients" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
          Retour aux clients
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux clients
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-serif text-stone-600">
                {client.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif text-stone-900">{client.fullName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.clientType === "sur_place"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {client.clientType === "sur_place" ? "Sur place" : "En ligne"}
                </span>
                {hasMeasurements && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Mesures enregistrées
                  </span>
                )}
                {orders.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                    {orders.length} commande{orders.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
              title="Exporter en Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter
            </button>
            <Link
              href={`/admin/clients/${client._id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-5 pt-5 border-t border-stone-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Téléphone</p>
                <p className="text-sm text-stone-900 font-medium">{client.phone}</p>
              </div>
            </div>

            {client.email && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Email</p>
                  <p className="text-sm text-stone-900 font-medium">{client.email}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Adresse</p>
                  <p className="text-sm text-stone-900 font-medium">{client.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">Client depuis</p>
                <p className="text-sm text-stone-900 font-medium">{new Date(client.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-medium mb-1">Notes internes</p>
            <p className="text-sm text-stone-700 bg-stone-50 rounded-lg p-3">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Mesures */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-stone-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
            Mesures
          </h2>
          <Link
            href={`/admin/clients/${client._id}/edit`}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Modifier les mesures
          </Link>
        </div>

        {hasMeasurements ? (
          <div className="space-y-4">
            {/* Standard measurements grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(Object.entries(MEASUREMENT_LABELS) as [string, string][]).map(([key, label]) => {
                const value = client.measurements?.[key as keyof ClientMeasurements];
                if (!value || typeof value !== "number") return null;
                return (
                  <div key={key} className="bg-stone-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-stone-400 font-medium mb-1">{label}</p>
                    <p className="text-lg font-bold text-stone-900">{value} <span className="text-xs font-normal text-stone-400">cm</span></p>
                  </div>
                );
              })}
            </div>

            {/* Custom measurements */}
            {client.measurements?.customMeasurements && client.measurements.customMeasurements.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 font-medium mb-2">Mesures personnalisées</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {client.measurements.customMeasurements.map((cm, i) => (
                    <div key={i} className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-amber-600 font-medium mb-1">{cm.label}</p>
                      <p className="text-lg font-bold text-stone-900">{cm.value} <span className="text-xs font-normal text-stone-400">cm</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Measurements notes */}
            {client.measurements?.notes && (
              <div>
                <p className="text-xs text-stone-400 font-medium mb-1">Notes mesures</p>
                <p className="text-sm text-stone-600 bg-stone-50 rounded-lg p-3">{client.measurements.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-stone-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
            </svg>
            <p className="text-sm text-stone-500 mb-2">Aucune mesure enregistrée</p>
            <Link
              href={`/admin/clients/${client._id}/edit`}
              className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter des mesures
            </Link>
          </div>
        )}
      </div>

      {/* Finances */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
        <h2 className="text-lg font-medium text-stone-900 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          Finances
        </h2>

        {orders.length > 0 ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-stone-50 rounded-lg p-4 text-center">
                <p className="text-xs text-stone-400 font-medium mb-1">Total à payer</p>
                <p className="text-lg sm:text-xl font-bold text-stone-900">{totalDue.toLocaleString("fr-FR")} <span className="text-xs font-normal text-stone-400">FCFA</span></p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-green-600 font-medium mb-1">Déjà payé</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">{totalPaid.toLocaleString("fr-FR")} <span className="text-xs font-normal text-green-400">FCFA</span></p>
              </div>
              <div className={`rounded-lg p-4 text-center ${totalRemaining > 0 ? "bg-amber-50" : "bg-green-50"}`}>
                <p className={`text-xs font-medium mb-1 ${totalRemaining > 0 ? "text-amber-600" : "text-green-600"}`}>Reste à payer</p>
                <p className={`text-lg sm:text-xl font-bold ${totalRemaining > 0 ? "text-amber-600" : "text-green-600"}`}>{totalRemaining.toLocaleString("fr-FR")} <span className={`text-xs font-normal ${totalRemaining > 0 ? "text-amber-400" : "text-green-400"}`}>FCFA</span></p>
              </div>
            </div>

            {/* Orders list */}
            <div className="space-y-3">
              {orders.map((order) => {
                const remaining = (order.totalPrice || 0) - (order.amountPaid || 0);
                const statusCfg = STATUS_LABELS[order.status] || { label: order.status, className: "bg-stone-100 text-stone-600" };
                const paymentCfg = PAYMENT_STATUS_LABELS[order.paymentStatus] || { label: order.paymentStatus, className: "bg-stone-100 text-stone-600" };
                return (
                  <div key={order._id} className="border border-stone-100 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-xs text-stone-500">
                          {order.product?.name || "Produit"} — {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentCfg.className}`}>
                          {paymentCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-stone-500">
                        <span>Total: <span className="font-medium text-stone-900">{order.totalPrice.toLocaleString("fr-FR")} FCFA</span></span>
                        <span>Payé: <span className="font-medium text-green-600">{(order.amountPaid || 0).toLocaleString("fr-FR")} FCFA</span></span>
                        {remaining > 0 && (
                          <span>Reste: <span className="font-medium text-amber-600">{remaining.toLocaleString("fr-FR")} FCFA</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-stone-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <p className="text-sm text-stone-500">Aucune commande pour ce client</p>
          </div>
        )}
      </div>
    </div>
  );
}
