"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Props = {
  orderId: string;
  totalPrice: number;
  amountPaid: number;
  clientId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

const METHODS = [
  { value: "especes", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "autre", label: "Autre" },
];

export default function PaymentModal({ orderId, totalPrice, amountPaid, clientId, onClose, onSuccess }: Props) {
  const remaining = totalPrice - amountPaid;
  const [amount, setAmount] = useState<number | "">(remaining > 0 ? remaining : "");
  const [paymentMethod, setPaymentMethod] = useState("especes");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const body: Record<string, unknown> = {
        order: orderId,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
      };
      if (clientId) body.client = clientId;
      if (notes) body.notes = notes;

      const res = await fetch(`${API_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.message || "Erreur lors de l'enregistrement");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium text-stone-900">Enregistrer un paiement</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Résumé */}
        <div className="bg-stone-50 rounded-lg p-4 mb-5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Total commande</span>
            <span className="font-medium">{totalPrice.toLocaleString("fr-FR")} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Déjà payé</span>
            <span className="font-medium text-green-600">{amountPaid.toLocaleString("fr-FR")} FCFA</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-1.5">
            <span className="text-stone-700 font-medium">Reste à payer</span>
            <span className="font-bold text-amber-600">{remaining.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Montant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">FCFA</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMethod === m.value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Référence, commentaire..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
