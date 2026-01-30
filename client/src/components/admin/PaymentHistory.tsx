"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Payment = {
  _id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
};

type Props = {
  orderId: string;
  refreshKey?: number;
};

const METHOD_LABELS: Record<string, { label: string; className: string }> = {
  especes: { label: "Espèces", className: "bg-green-100 text-green-700" },
  wave: { label: "Wave", className: "bg-blue-100 text-blue-700" },
  orange_money: { label: "Orange Money", className: "bg-orange-100 text-orange-700" },
  autre: { label: "Autre", className: "bg-stone-100 text-stone-600" },
};

export default function PaymentHistory({ orderId, refreshKey }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [orderId, refreshKey]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/payments?order=${orderId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
        setTotal((data.data || []).reduce((sum: number, p: Payment) => sum + p.amount, 0));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/payments/${paymentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchPayments();
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return <div className="animate-pulse h-16 bg-stone-100 rounded" />;
  }

  if (payments.length === 0) {
    return (
      <p className="text-sm text-stone-400 italic">Aucun paiement enregistré</p>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => {
        const method = METHOD_LABELS[p.paymentMethod] || METHOD_LABELS.autre;
        return (
          <div key={p._id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${method.className}`}>
                {method.label}
              </span>
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {p.amount.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs text-stone-400">
                  {new Date(p.paymentDate).toLocaleDateString("fr-FR")}
                  {p.notes && ` — ${p.notes}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(p._id)}
              className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
              title="Supprimer ce paiement"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
      <div className="flex justify-between pt-2 border-t border-stone-200">
        <span className="text-sm font-medium text-stone-700">Total encaissé</span>
        <span className="text-sm font-bold text-green-600">{total.toLocaleString("fr-FR")} FCFA</span>
      </div>
    </div>
  );
}

export { type Payment };
