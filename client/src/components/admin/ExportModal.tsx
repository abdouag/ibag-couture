"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ExportType = "clients" | "measurements" | "orders" | "payments" | "finances";

type Props = {
  exportType: ExportType;
  onClose: () => void;
};

const EXPORT_CONFIG: Record<ExportType, { title: string; endpoint: string }> = {
  clients: { title: "Exporter les clients", endpoint: "/api/exports/clients" },
  measurements: { title: "Exporter les mesures", endpoint: "/api/exports/measurements" },
  orders: { title: "Exporter les commandes", endpoint: "/api/exports/orders" },
  payments: { title: "Exporter les paiements", endpoint: "/api/exports/payments" },
  finances: { title: "Exporter le bilan financier", endpoint: "/api/exports/finances" },
};

export default function ExportModal({ exportType, onClose }: Props) {
  const config = EXPORT_CONFIG[exportType];
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // Filtres
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [clientType, setClientType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const handleExport = async () => {
    setDownloading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("format", "xlsx");

      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (status) params.set("status", status);
      if (clientType) params.set("clientType", clientType);
      if (paymentMethod) params.set("paymentMethod", paymentMethod);
      if (exportType === "finances" && year) params.set("year", year);

      const res = await fetch(`${API_URL}${config.endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("Erreur lors de l'export");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportType}-ibag-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setDownloading(false);
    }
  };

  const showDateFilters = ["orders", "payments"].includes(exportType);
  const showStatusFilter = exportType === "orders";
  const showClientTypeFilter = ["clients", "measurements"].includes(exportType);
  const showMethodFilter = exportType === "payments";
  const showYearFilter = exportType === "finances";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium text-stone-900">{config.title}</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {showDateFilters && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Date début</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Date fin</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {showStatusFilter && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="in_production">En confection</option>
                <option value="ready">Prêt</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          )}

          {showClientTypeFilter && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Type de client</label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="sur_place">Sur place</option>
                <option value="en_ligne">En ligne</option>
              </select>
            </div>
          )}

          {showMethodFilter && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Mode de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="especes">Espèces</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          )}

          {showYearFilter && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Année</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2020"
                max="2030"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}

          {!showDateFilters && !showStatusFilter && !showClientTypeFilter && !showMethodFilter && !showYearFilter && (
            <p className="text-sm text-stone-500">L&apos;export contiendra toutes les données.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Téléchargement...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Télécharger .xlsx
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
