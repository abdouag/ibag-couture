"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Order = {
  _id: string;
  orderNumber: string;
  product: {
    _id: string;
    name: string;
    category: string;
    basePrice: number;
  };
  customer: {
    fullName: string;
    phone: string;
    email: string;
    city?: string;
    address?: string;
  };
  size?: string;
  measurements?: {
    shoulders?: string;
    chest?: string;
    waist?: string;
    hips?: string;
    garmentLength?: string;
    notes?: string;
  };
  selectedOptions?: Array<{
    name: string;
    price: number;
  }>;
  notes?: string;
  adminNotes?: string;
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  isGuest?: boolean;
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: JSX.Element }> = {
  pending: {
    label: "En attente",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  in_production: {
    label: "En confection",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  ready: {
    label: "Pret",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  delivered: {
    label: "Livre",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
};

const statusOptions = [
  { value: "pending", label: "En attente" },
  { value: "in_production", label: "En confection" },
  { value: "ready", label: "Pret" },
  { value: "delivered", label: "Livre" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Eviter de mettre a jour si deja le meme statut
    const currentOrder = orders.find((o) => o._id === orderId);
    if (currentOrder?.status === newStatus) return;

    setUpdatingStatus(newStatus);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la mise a jour");
      }

      // Mise a jour optimiste de l'UI
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // Message de succes
      const statusLabel = statusConfig[newStatus]?.label || newStatus;
      setStatusMessage({
        type: "success",
        text: `Statut mis a jour : ${statusLabel}`,
      });

      // Hook pour notification future (email)
      // TODO: Implementer l'envoi d'email au client
      // onStatusChange(orderId, newStatus, currentOrder?.customer);

      // Auto-hide le message apres 3s
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update status:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur lors de la mise a jour",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    const currentOrder = orders.find((o) => o._id === orderId);
    if (currentOrder?.paymentStatus === newPaymentStatus) return;

    setUpdatingPayment(newPaymentStatus);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
      }

      const labels: Record<string, string> = { unpaid: "Non paye", paid: "Paye", refunded: "Rembourse" };
      setStatusMessage({ type: "success", text: `Paiement : ${labels[newPaymentStatus] || newPaymentStatus}` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  const saveAdminNotes = async (orderId: string) => {
    setSavingNotes(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: adminNotesInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, adminNotes: adminNotesInput } : order
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, adminNotes: adminNotesInput });
      }

      setStatusMessage({ type: "success", text: "Notes internes sauvegardees" });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  // Hook prepare pour l'envoi d'emails (implementation future)
  // const onStatusChange = async (orderId: string, newStatus: string, customer: Order["customer"]) => {
  //   const statusMessages: Record<string, string> = {
  //     in_production: "Votre commande est maintenant en confection",
  //     ready: "Votre commande est prete !",
  //     delivered: "Votre commande a ete livree",
  //   };
  //   const message = statusMessages[newStatus];
  //   if (message && customer?.email) {
  //     await fetch(`${API_URL}/api/notifications/email`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: customer.email, subject: "Mise a jour commande", message }),
  //     });
  //   }
  // };

  const filteredOrders = orders
    .filter((order) => filterStatus === "all" || order.status === filterStatus)
    .filter(
      (order) =>
        !searchQuery ||
        order.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.phone.includes(searchQuery) ||
        order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full" />
            <p className="text-stone-500 text-sm">Chargement des commandes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-stone-500 text-sm">{orders.length} commandes au total</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom, telephone ou produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                filterStatus === "all"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              Toutes ({orders.length})
            </button>
            {statusOptions.map((status) => {
              const count = orders.filter((o) => o.status === status.value).length;
              const config = statusConfig[status.value];
              return (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                    filterStatus === status.value
                      ? `${config.bgColor} ${config.color} border-transparent`
                      : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {status.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Aucune commande</h3>
          <p className="text-stone-500">
            {orders.length === 0
              ? "Vous n'avez pas encore recu de commande."
              : "Aucune commande ne correspond a vos criteres."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            return (
              <button
                key={order._id}
                onClick={() => { setSelectedOrder(order); setAdminNotesInput(order.adminNotes || ""); }}
                className="w-full bg-white rounded-xl border border-stone-200 p-4 sm:p-5 hover:shadow-md hover:border-stone-300 transition-all text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Status Icon */}
                  <div className={`hidden sm:flex w-12 h-12 ${config.bgColor} rounded-xl items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-900 truncate">
                          {order.orderNumber || order._id.slice(-6).toUpperCase()} — {order.customer.fullName}
                        </h3>
                        {order.size === "sur-mesure" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                            </svg>
                            Sur mesure
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {order.paymentStatus === "paid" ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Paye</span>
                        ) : order.paymentStatus === "refunded" ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-200 text-stone-600">Rembourse</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">Non paye</span>
                        )}
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        {order.customer.phone}
                      </span>
                      <span className="hidden sm:inline text-stone-300">|</span>
                      <span>{order.product?.name || "Produit"}</span>
                      {order.size !== "sur-mesure" && order.size && (
                        <>
                          <span className="hidden sm:inline text-stone-300">|</span>
                          <span>Taille {order.size}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price & Date */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <p className="font-bold text-stone-900">
                      {order.totalPrice?.toLocaleString("fr-FR")}
                      <span className="text-xs font-normal text-stone-400 ml-1">FCFA</span>
                    </p>
                    <p className="text-xs text-stone-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-200 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold text-stone-900">
                    Commande #{selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}
                  </h2>
                  {selectedOrder.size === "sur-mesure" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-full border border-amber-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                      </svg>
                      Sur mesure
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-500">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Status Change */}
                <div className="bg-stone-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    Statut de la commande
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => {
                      const config = statusConfig[status.value];
                      const isActive = selectedOrder.status === status.value;
                      const isUpdating = updatingStatus === status.value;
                      return (
                        <button
                          key={status.value}
                          onClick={() => updateOrderStatus(selectedOrder._id, status.value)}
                          disabled={updatingStatus !== null}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed ${
                            isActive
                              ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ${status.value === "pending" ? "ring-yellow-400" : status.value === "in_production" ? "ring-purple-400" : status.value === "ready" ? "ring-blue-400" : "ring-green-400"}`
                              : updatingStatus !== null && !isUpdating
                              ? "bg-stone-100 text-stone-400 border border-stone-200"
                              : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:shadow-sm"
                          }`}
                        >
                          {isUpdating ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            config.icon
                          )}
                          {status.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status Message */}
                  {statusMessage && (
                    <div
                      className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm animate-fadeIn ${
                        statusMessage.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {statusMessage.type === "success" ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {statusMessage.text}
                    </div>
                  )}
                </div>

                {/* Payment Status */}
                <div className="bg-stone-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    Statut de paiement
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { value: "unpaid", label: "Non paye", color: "text-red-700", bgColor: "bg-red-100", ring: "ring-red-400" },
                      { value: "paid", label: "Paye", color: "text-green-700", bgColor: "bg-green-100", ring: "ring-green-400" },
                      { value: "refunded", label: "Rembourse", color: "text-stone-700", bgColor: "bg-stone-200", ring: "ring-stone-400" },
                    ] as const).map((ps) => {
                      const isActive = selectedOrder.paymentStatus === ps.value;
                      const isUpdating = updatingPayment === ps.value;
                      return (
                        <button
                          key={ps.value}
                          onClick={() => updatePaymentStatus(selectedOrder._id, ps.value)}
                          disabled={updatingPayment !== null}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed ${
                            isActive
                              ? `${ps.bgColor} ${ps.color} ring-2 ring-offset-2 ${ps.ring}`
                              : updatingPayment !== null && !isUpdating
                              ? "bg-stone-100 text-stone-400 border border-stone-200"
                              : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:shadow-sm"
                          }`}
                        >
                          {isUpdating ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${ps.value === "unpaid" ? "bg-red-500" : ps.value === "paid" ? "bg-green-500" : "bg-stone-400"}`} />
                          )}
                          {ps.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Informations client
                  </h3>
                  <div className="bg-white border border-stone-200 rounded-xl p-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Nom</p>
                        <p className="text-stone-900 font-medium">{selectedOrder.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Telephone</p>
                        <a
                          href={`tel:${selectedOrder.customer.phone}`}
                          className="text-stone-900 font-medium hover:text-stone-700"
                        >
                          {selectedOrder.customer.phone}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Email</p>
                        <a
                          href={`mailto:${selectedOrder.customer.email}`}
                          className="text-stone-900 hover:text-stone-700 truncate block"
                        >
                          {selectedOrder.customer.email}
                        </a>
                      </div>
                      {selectedOrder.customer.city && (
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Ville</p>
                          <p className="text-stone-900">{selectedOrder.customer.city}</p>
                        </div>
                      )}
                      {selectedOrder.customer.address && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-stone-500 mb-1">Adresse</p>
                          <p className="text-stone-900">{selectedOrder.customer.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Details produit
                  </h3>
                  <div className="bg-white border border-stone-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
                          {selectedOrder.product?.category || "Categorie"}
                        </p>
                        <p className="text-lg font-semibold text-stone-900">
                          {selectedOrder.product?.name || "Produit"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-500 mb-1">Taille</p>
                        <p className={`font-medium ${selectedOrder.size === "sur-mesure" ? "text-amber-600" : "text-stone-900"}`}>
                          {selectedOrder.size === "sur-mesure" ? "Sur mesure" : selectedOrder.size || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Options */}
                    {selectedOrder.selectedOptions && selectedOrder.selectedOptions.length > 0 && (
                      <div className="pt-4 border-t border-stone-100">
                        <p className="text-xs text-stone-500 mb-2">Options selectionnees</p>
                        <div className="space-y-2">
                          {selectedOrder.selectedOptions.map((opt, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-stone-600">{opt.name}</span>
                              <span className="text-stone-900 font-medium">+{opt.price.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="pt-4 mt-4 border-t border-stone-200">
                      <div className="flex justify-between items-baseline">
                        <span className="text-stone-600">Total</span>
                        <span className="text-2xl font-bold text-stone-900">
                          {selectedOrder.totalPrice.toLocaleString("fr-FR")}
                          <span className="text-sm font-normal text-stone-400 ml-1">FCFA</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements */}
                {selectedOrder.size === "sur-mesure" && selectedOrder.measurements && (
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                      </svg>
                      Mesures client
                    </h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {selectedOrder.measurements.shoulders && (
                          <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Epaules</p>
                            <p className="text-lg font-bold text-stone-900">{selectedOrder.measurements.shoulders}</p>
                            <p className="text-xs text-stone-400">cm</p>
                          </div>
                        )}
                        {selectedOrder.measurements.chest && (
                          <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Poitrine</p>
                            <p className="text-lg font-bold text-stone-900">{selectedOrder.measurements.chest}</p>
                            <p className="text-xs text-stone-400">cm</p>
                          </div>
                        )}
                        {selectedOrder.measurements.waist && (
                          <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Taille</p>
                            <p className="text-lg font-bold text-stone-900">{selectedOrder.measurements.waist}</p>
                            <p className="text-xs text-stone-400">cm</p>
                          </div>
                        )}
                        {selectedOrder.measurements.hips && (
                          <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Hanches</p>
                            <p className="text-lg font-bold text-stone-900">{selectedOrder.measurements.hips}</p>
                            <p className="text-xs text-stone-400">cm</p>
                          </div>
                        )}
                        {selectedOrder.measurements.garmentLength && (
                          <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-stone-500 mb-1">Longueur</p>
                            <p className="text-lg font-bold text-stone-900">{selectedOrder.measurements.garmentLength}</p>
                            <p className="text-xs text-stone-400">cm</p>
                          </div>
                        )}
                      </div>
                      {selectedOrder.measurements.notes && (
                        <div className="mt-4 pt-4 border-t border-amber-200">
                          <p className="text-xs text-stone-500 mb-1">Notes mesures</p>
                          <p className="text-stone-700">{selectedOrder.measurements.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Client Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                      Notes client
                    </h3>
                    <div className="bg-white border border-stone-200 rounded-xl p-4">
                      <p className="text-stone-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Notes internes (atelier)
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <textarea
                      value={adminNotesInput}
                      onChange={(e) => setAdminNotesInput(e.target.value)}
                      placeholder="Notes reservees a l'equipe : tissu commande, retouche prevue, client rappele..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-amber-200 bg-white text-stone-900 placeholder-stone-400 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => saveAdminNotes(selectedOrder._id)}
                        disabled={savingNotes}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 transition-colors"
                      >
                        {savingNotes ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
              <a
                href={`tel:${selectedOrder.customer.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 text-stone-700 text-sm font-medium hover:bg-white transition-colors rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Appeler
              </a>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
