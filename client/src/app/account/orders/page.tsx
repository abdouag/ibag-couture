"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type Order = {
  _id: string;
  orderNumber: string;
  product: {
    name: string;
    slug: string;
    mainImage?: string;
  };
  size: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  in_production: { label: "En confection", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Prete", color: "bg-green-100 text-green-800" },
  delivered: { label: "Livree", color: "bg-stone-100 text-stone-800" },
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

        const data = await api("/api/orders/my-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(data.data || []);
      } catch {
        setError("Impossible de charger vos commandes.");
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-sm border border-stone-200 p-6 animate-pulse">
              <div className="h-4 bg-stone-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-stone-100 rounded w-1/2"></div>
            </div>
          ))}
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
        <div className="bg-red-50 border border-red-100 rounded-sm p-6 text-center">
          <p className="text-red-700 text-sm">{error}</p>
          {error.includes("connecter") && (
            <Link
              href="/login"
              className="inline-block mt-4 bg-stone-900 text-white px-6 py-2.5 text-sm hover:bg-stone-800 transition-colors"
            >
              Se connecter
            </Link>
          )}
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
            Suivez l&apos;avancement de vos creations sur mesure
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
            <div key={order._id} className="bg-white rounded-sm border border-stone-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-stone-900">#{order.orderNumber}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  statusLabels[order.status]?.color || 'bg-stone-100 text-stone-800'
                }`}>
                  {statusLabels[order.status]?.label || order.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {order.product?.mainImage && (
                  <img
                    src={order.product.mainImage}
                    alt={order.product?.name}
                    className="w-12 h-12 object-cover rounded-sm bg-stone-100"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-900 truncate">{order.product?.name || "Produit"}</p>
                  <p className="text-xs text-stone-500">
                    Taille : {order.size === 'sur-mesure' ? 'Sur-mesure' : order.size}
                  </p>
                </div>
                <p className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                  {order.totalPrice.toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-100">
                <Link
                  href={`/produits/${order.product?.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 transition-colors"
                >
                  Voir le produit
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
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
