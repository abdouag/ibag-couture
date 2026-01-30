"use client";

import { useState, useEffect } from "react";
import { RevenueChart, PaymentMethodChart } from "@/components/admin/FinanceChart";
import ExportModal from "@/components/admin/ExportModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Summary = {
  totalRevenue: number;
  totalCollected: number;
  totalRemaining: number;
  ordersCount: number;
  paidOrdersCount: number;
  partialOrdersCount: number;
  unpaidOrdersCount: number;
};

type RevenueData = { date: string; revenue: number; count: number }[];
type MethodData = { method: string; label: string; total: number; count: number }[];
type OutstandingOrder = {
  _id: string;
  orderNumber?: string;
  customer?: { fullName: string };
  client?: { fullName: string };
  totalPrice: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: string;
  createdAt: string;
};

export default function FinancesPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenue, setRevenue] = useState<RevenueData>([]);
  const [methods, setMethods] = useState<MethodData>([]);
  const [outstanding, setOutstanding] = useState<OutstandingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "daily">("monthly");
  const [year] = useState(new Date().getFullYear());
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [period]);

  const fetchAll = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [sumRes, revRes, methRes, outRes] = await Promise.all([
        fetch(`${API_URL}/api/finances/summary`, { headers }),
        fetch(`${API_URL}/api/finances/revenue?period=${period}&year=${year}`, { headers }),
        fetch(`${API_URL}/api/finances/by-method`, { headers }),
        fetch(`${API_URL}/api/finances/outstanding`, { headers }),
      ]);

      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data.data);
      }
      if (revRes.ok) {
        const data = await revRes.json();
        setRevenue(data.data);
      }
      if (methRes.ok) {
        const data = await methRes.json();
        setMethods(data.data);
      }
      if (outRes.ok) {
        const data = await outRes.json();
        setOutstanding(data.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse h-24" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-stone-900">Finance</h1>
          <p className="text-sm text-stone-500 mt-1">Vue d&apos;ensemble financière</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter
        </button>
      </div>

      {/* Stats cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Chiffre d&apos;affaires</p>
            <p className="text-xl font-bold text-stone-900">{fmt(summary.totalRevenue)}</p>
            <p className="text-xs text-stone-400">FCFA</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total encaissé</p>
            <p className="text-xl font-bold text-green-600">{fmt(summary.totalCollected)}</p>
            <p className="text-xs text-stone-400">FCFA</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Reste à encaisser</p>
            <p className="text-xl font-bold text-amber-600">{fmt(summary.totalRemaining)}</p>
            <p className="text-xs text-stone-400">FCFA</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Commandes</p>
            <p className="text-xl font-bold text-stone-900">{summary.ordersCount}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{summary.paidOrdersCount} payé{summary.paidOrdersCount > 1 ? "s" : ""}</span>
              <span className="text-amber-600">{summary.partialOrdersCount} acompte{summary.partialOrdersCount > 1 ? "s" : ""}</span>
              <span className="text-stone-400">{summary.unpaidOrdersCount} impayé{summary.unpaidOrdersCount > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-stone-900">Chiffre d&apos;affaires</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setPeriod("monthly")}
                className={`px-3 py-1 rounded text-xs font-medium ${period === "monthly" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setPeriod("daily")}
                className={`px-3 py-1 rounded text-xs font-medium ${period === "daily" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100"}`}
              >
                Journalier
              </button>
            </div>
          </div>
          <RevenueChart data={revenue} />
        </div>

        {/* Payment method chart */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-medium text-stone-900 mb-4">Répartition par mode de paiement</h2>
          <PaymentMethodChart data={methods} />
        </div>
      </div>

      {/* Outstanding orders */}
      {outstanding.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="font-medium text-stone-900 mb-4">
            Commandes avec solde restant ({outstanding.length})
          </h2>
          <div className="space-y-2">
            {outstanding.slice(0, 20).map((order) => (
              <div key={order._id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {order.orderNumber || order._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-xs text-stone-500">
                    {order.customer?.fullName || order.client?.fullName || "—"} — {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">
                    {fmt(order.remainingAmount)} FCFA restant
                  </p>
                  <p className="text-xs text-stone-400">
                    sur {fmt(order.totalPrice)} FCFA ({fmt(order.amountPaid)} payé)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          exportType="finances"
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
