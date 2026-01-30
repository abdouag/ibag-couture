"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  inProductionOrders: number;
  completedOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
};

type RecentOrder = {
  _id: string;
  clientName: string;
  clientPhone: string;
  productName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

type FinanceSummary = {
  totalRevenue: number;
  totalCollected: number;
  totalRemaining: number;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  in_production: { label: "En confection", color: "bg-purple-100 text-purple-700" },
  ready: { label: "Pret", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Livre", color: "bg-green-100 text-green-700" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    inProductionOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch orders
        const ordersRes = await fetch(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersRes.json();

        // Fetch products
        const productsRes = await fetch(`${API_URL}/api/products?limit=1000`);
        const productsData = await productsRes.json();

        // Fetch finance summary
        try {
          const finRes = await fetch(`${API_URL}/api/finances/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (finRes.ok) {
            const finData = await finRes.json();
            setFinance(finData.data);
          }
        } catch {
          // Finance API may not be available
        }

        if (ordersData.success && ordersData.data) {
          const orders = ordersData.data;
          const totalRevenue = orders
            .filter((o: { status: string }) => o.status === "delivered")
            .reduce((acc: number, o: { totalPrice: number }) => acc + (o.totalPrice || 0), 0);

          setStats({
            totalOrders: orders.length,
            pendingOrders: orders.filter((o: { status: string }) => o.status === "pending").length,
            inProductionOrders: orders.filter((o: { status: string }) => o.status === "in_production").length,
            completedOrders: orders.filter((o: { status: string }) => o.status === "delivered").length,
            totalProducts: productsData.data?.length || 0,
            activeProducts: productsData.data?.filter((p: { isActive: boolean }) => p.isActive).length || 0,
            totalRevenue,
          });

          // Get 5 most recent orders
          setRecentOrders(
            orders
              .sort((a: { createdAt: string }, b: { createdAt: string }) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .slice(0, 5)
          );
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <p className="text-stone-500">Bienvenue dans votre espace d&apos;administration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Total commandes</p>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  stats.totalOrders
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">En attente</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  stats.pendingOrders
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">En confection</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  stats.inProductionOrders
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Livrees</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  stats.completedOrders
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Finance + Products */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone-400 text-sm font-medium mb-1">Chiffre d&apos;affaires</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {loading ? (
                  <span className="inline-block w-24 h-8 bg-stone-700 animate-pulse rounded" />
                ) : (
                  <>
                    {(finance?.totalRevenue ?? stats.totalRevenue).toLocaleString("fr-FR")}
                    <span className="text-base font-normal text-stone-400 ml-1">FCFA</span>
                  </>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          </div>
          <Link href="/admin/finances" className="text-stone-400 text-sm hover:text-white transition-colors">
            Voir les finances &rarr;
          </Link>
        </div>

        {/* Collected Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone-500 text-sm font-medium mb-1">Total encaiss&#233;</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                {loading || !finance ? (
                  <span className="inline-block w-20 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  <>
                    {finance.totalCollected.toLocaleString("fr-FR")}
                    <span className="text-base font-normal text-stone-400 ml-1">FCFA</span>
                  </>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-stone-400 text-sm">
            {finance ? `${finance.totalRemaining.toLocaleString("fr-FR")} FCFA restant` : "\u2014"}
          </p>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone-500 text-sm font-medium mb-1">Produits au catalogue</p>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded" />
                ) : (
                  stats.totalProducts
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {loading ? "-" : stats.activeProducts} actifs
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-stone-100 text-stone-500 text-xs font-medium rounded-full">
              {loading ? "-" : stats.totalProducts - stats.activeProducts} inactifs
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Commandes recentes</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Voir tout
            </Link>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <p>Aucune commande pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900 truncate">{order.clientName}</p>
                      <p className="text-sm text-stone-500 truncate">{order.productName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-stone-900">
                        {order.totalPrice?.toLocaleString("fr-FR")} <span className="text-xs text-stone-400">FCFA</span>
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusLabels[order.status]?.color || "bg-stone-100 text-stone-500"}`}>
                        {statusLabels[order.status]?.label || order.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-2">{formatDate(order.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-semibold text-stone-900 mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-3 p-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="font-medium text-sm">Nouveau produit</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 p-3 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="font-medium text-sm">Gerer les commandes</span>
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center gap-3 p-3 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span className="font-medium text-sm">Voir le catalogue</span>
              </Link>
              <Link
                href="/admin/clients/new"
                className="flex items-center gap-3 p-3 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                <span className="font-medium text-sm">Nouveau client</span>
              </Link>
              <Link
                href="/admin/workshop"
                className="flex items-center gap-3 p-3 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17l-5.384 5.383a1.5 1.5 0 01-2.121 0l-.353-.354a1.5 1.5 0 010-2.121l5.384-5.383m2.474 2.474L15.96 11.63a3 3 0 000-4.243l-3.536-3.536a3 3 0 00-4.243 0L4.646 7.387a3 3 0 000 4.243l3.536 3.536a3 3 0 004.243 0zm0 0l2.474-2.474" />
                </svg>
                <span className="font-medium text-sm">Suivi atelier</span>
              </Link>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-amber-900 text-sm mb-1">Conseil du jour</h3>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Pensez a mettre a jour le statut de vos commandes regulierement pour tenir vos clients informes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
