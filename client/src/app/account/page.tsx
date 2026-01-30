"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  _id: string;
  email: string;
  fullName?: string;
  role: string;
  createdAt?: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const stats = [
    {
      label: "Commandes",
      value: "0",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      href: "/account/orders",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Mesures",
      value: "Non definies",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
        </svg>
      ),
      href: "/account/measures",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-white rounded-sm border border-stone-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-serif text-stone-900 mb-2">
              Bienvenue dans votre espace client
            </h2>
            <p className="text-stone-600">
              Gerez vos commandes, vos mesures et suivez vos creations sur mesure.
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm tracking-wide hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            Decouvrir nos collections
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white rounded-sm border border-stone-200 p-6 hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <svg
                className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <p className="text-2xl font-serif text-stone-900 mb-1">{stat.value}</p>
            <p className="text-sm text-stone-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="font-medium text-stone-900">Informations du compte</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Nom complet</p>
              <p className="text-stone-900">{user?.fullName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Email</p>
              <p className="text-stone-900">{user?.email || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="font-medium text-stone-900">Actions rapides</h3>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/account/measures"
              className="flex items-center gap-3 p-4 border border-stone-200 rounded-sm hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">Ajouter mes mesures</p>
                <p className="text-xs text-stone-500">Pour vos commandes sur mesure</p>
              </div>
            </Link>

            <Link
              href="/collections"
              className="flex items-center gap-3 p-4 border border-stone-200 rounded-sm hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">Commander</p>
                <p className="text-xs text-stone-500">Parcourir nos collections</p>
              </div>
            </Link>

            <Link
              href="/contact"
              className="flex items-center gap-3 p-4 border border-stone-200 rounded-sm hover:border-stone-300 hover:bg-stone-50 transition-all"
            >
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900">Nous contacter</p>
                <p className="text-xs text-stone-500">Une question ?</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
