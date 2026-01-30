"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type WorkshopOrder = {
  _id: string;
  orderNumber?: string;
  customer?: { fullName: string; phone: string };
  client?: { fullName: string; phone: string };
  product?: { name: string; category: string; productionTime?: number };
  totalPrice: number;
  status: string;
  workshopStatus: string;
  assignedTailor?: string;
  productionStartDate?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
};

const WS_STATUSES = [
  { value: "all", label: "Toutes", className: "bg-stone-900 text-white" },
  { value: "en_attente", label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  { value: "en_cours", label: "En cours", className: "bg-blue-100 text-blue-700" },
  { value: "retouche", label: "Retouche", className: "bg-purple-100 text-purple-700" },
  { value: "pret", label: "Prêt", className: "bg-green-100 text-green-700" },
  { value: "livre", label: "Livré", className: "bg-stone-100 text-stone-600" },
];

const WS_BADGE: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  en_cours: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  retouche: { label: "Retouche", className: "bg-purple-100 text-purple-700" },
  pret: { label: "Prêt", className: "bg-green-100 text-green-700" },
  livre: { label: "Livré", className: "bg-stone-100 text-stone-600" },
};

export default function WorkshopPage() {
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTailor, setEditTailor] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editWs, setEditWs] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/workshop`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (order: WorkshopOrder) => {
    setEditingId(order._id);
    setEditTailor(order.assignedTailor || "");
    setEditExpected(order.expectedDeliveryDate ? order.expectedDeliveryDate.split("T")[0] : "");
    setEditWs(order.workshopStatus || "en_attente");
  };

  const saveWorkshop = async (orderId: string) => {
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = { workshopStatus: editWs };
      if (editTailor) body.assignedTailor = editTailor;
      if (editExpected) body.expectedDeliveryDate = editExpected;
      if (!editTailor) body.assignedTailor = "";

      const res = await fetch(`${API_URL}/api/orders/${orderId}/workshop`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Informations atelier mises à jour" });
        setEditingId(null);
        fetchOrders();
      } else {
        setMessage({ type: "error", text: "Erreur lors de la mise à jour" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const quickStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/workshop`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workshopStatus: newStatus,
          ...(newStatus === "en_cours" && { productionStartDate: new Date().toISOString() }),
        }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {
      // silent
    }
  };

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.workshopStatus === filterStatus);

  const isOverdue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-stone-900">Suivi Atelier</h1>
        <p className="text-sm text-stone-500 mt-1">{orders.length} commande{orders.length > 1 ? "s" : ""} en cours</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {WS_STATUSES.map((s) => {
          const count = s.value === "all" ? orders.length : orders.filter((o) => o.workshopStatus === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s.value
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <svg className="w-12 h-12 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-stone-900 font-medium mb-1">Aucune commande</h3>
          <p className="text-sm text-stone-500">Aucune commande avec ce statut atelier.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const clientName = order.customer?.fullName || order.client?.fullName || "—";
            const clientPhone = order.customer?.phone || order.client?.phone || "";
            const badge = WS_BADGE[order.workshopStatus] || WS_BADGE.en_attente;
            const overdue = isOverdue(order.expectedDeliveryDate) && order.workshopStatus !== "livre" && order.workshopStatus !== "pret";

            return (
              <div key={order._id} className={`bg-white rounded-xl border p-4 sm:p-5 ${overdue ? "border-red-300 bg-red-50/30" : "border-stone-200"}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-stone-900">
                        {order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                      {overdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          En retard
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600">{clientName} — {order.product?.name || "Produit"}</p>
                    {clientPhone && (
                      <p className="text-xs text-stone-400 mt-0.5">{clientPhone}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{order.totalPrice.toLocaleString("fr-FR")} FCFA</p>
                    {order.assignedTailor && (
                      <p className="text-xs text-stone-500">Couturier: {order.assignedTailor}</p>
                    )}
                    {order.expectedDeliveryDate && (
                      <p className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-stone-400"}`}>
                        Prévu: {new Date(order.expectedDeliveryDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                {editingId === order._id ? (
                  <div className="border-t border-stone-200 pt-3 mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Couturier</label>
                        <input
                          type="text"
                          value={editTailor}
                          onChange={(e) => setEditTailor(e.target.value)}
                          placeholder="Nom du couturier"
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Livraison prévue</label>
                        <input
                          type="date"
                          value={editExpected}
                          onChange={(e) => setEditExpected(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">Statut atelier</label>
                        <select
                          value={editWs}
                          onChange={(e) => setEditWs(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          {WS_STATUSES.filter((s) => s.value !== "all").map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveWorkshop(order._id)}
                        className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-stone-100 pt-3 mt-3">
                    <button
                      onClick={() => startEditing(order)}
                      className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50"
                    >
                      Modifier
                    </button>
                    {order.workshopStatus === "en_attente" && (
                      <button
                        onClick={() => quickStatusChange(order._id, "en_cours")}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                      >
                        Démarrer
                      </button>
                    )}
                    {order.workshopStatus === "en_cours" && (
                      <button
                        onClick={() => quickStatusChange(order._id, "pret")}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        Marquer prêt
                      </button>
                    )}
                    {order.workshopStatus === "pret" && (
                      <button
                        onClick={() => quickStatusChange(order._id, "livre")}
                        className="px-3 py-1.5 bg-stone-700 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
                      >
                        Marquer livré
                      </button>
                    )}
                    {(order.workshopStatus === "en_cours" || order.workshopStatus === "pret") && (
                      <button
                        onClick={() => quickStatusChange(order._id, "retouche")}
                        className="px-3 py-1.5 border border-purple-300 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-50"
                      >
                        Retouche
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
