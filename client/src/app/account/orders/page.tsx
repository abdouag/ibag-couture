"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Order = {
  _id: string;
  orderNumber: string;
  product: {
    name: string;
    slug: string;
    images?: string[];
  };
  totalPrice: number;
  status: string;
  createdAt: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmee", color: "bg-blue-100 text-blue-800" },
  in_production: { label: "En confection", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Prete", color: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Livree", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulee", color: "bg-red-100 text-red-800" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Veuillez vous connecter pour voir vos commandes.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Erreur lors de la recuperation des commandes");
        }

        const data = await res.json();
        setOrders(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-stone-900">Mes commandes</h2>
          <p className="text-sm text-stone-500 mt-1">Chargement...</p>
        </div>
        <div className="bg-white rounded-sm border border-stone-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-stone-900">Mes commandes</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-sm p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-stone-900">Mes commandes</h2>
          <p className="text-sm text-stone-500 mt-1">
            {orders.length > 0
              ? `${orders.length} commande${orders.length > 1 ? "s" : ""}`
              : "Suivez l'avancement de vos creations sur mesure"}
          </p>
        </div>
        <Link
          href="/collections"
          className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 text-sm tracking-wide hover:bg-stone-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle commande
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-sm border border-stone-200 p-8 md:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif text-stone-900 mb-2">
            Vous n&apos;avez pas encore de commande
          </h3>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">
            Explorez nos collections et commandez votre premiere creation sur mesure.
            Chaque piece est confectionnee avec soin selon vos mesures.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 text-sm tracking-wide hover:bg-stone-800 transition-colors"
          >
            Decouvrir nos collections
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-sm border border-stone-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Product image */}
                {order.product?.images?.[0] && (
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-stone-100">
                    <img
                      src={order.product.images[0]}
                      alt={order.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-stone-900 truncate">
                      {order.product?.name || "Produit"}
                    </p>
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                      statusLabels[order.status]?.color || "bg-stone-100 text-stone-800"
                    }`}>
                      {statusLabels[order.status]?.label || order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                    <span>#{order.orderNumber}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span className="font-medium text-stone-900">
                      {order.totalPrice?.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-100 rounded-sm p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-stone-900 mb-1">Comment ca marche ?</h4>
            <p className="text-sm text-stone-600">
              Apres votre commande, notre equipe vous contactera pour confirmer vos mesures
              et les details de votre creation. Vous recevrez des mises a jour par email
              a chaque etape de la confection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
