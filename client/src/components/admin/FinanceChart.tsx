"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type BarChartData = {
  date: string;
  revenue: number;
  count: number;
};

type PieChartData = {
  method: string;
  label: string;
  total: number;
  count: number;
};

const COLORS = ["#059669", "#2563eb", "#f97316", "#78716c"];

const formatFCFA = (value: number) => {
  return `${value.toLocaleString("fr-FR")} F`;
};

export function RevenueChart({ data }: { data: BarChartData[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-stone-400 italic text-center py-8">Aucune donnée disponible</p>;
  }

  const formattedData = data.map((d) => ({
    ...d,
    label: d.date.length > 7 ? d.date.slice(8) : d.date.slice(5),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value: number) => [formatFCFA(value), "CA"]}
          labelFormatter={(label) => `Période: ${label}`}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Bar dataKey="revenue" fill="#b45309" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PaymentMethodChart({ data }: { data: PieChartData[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-stone-400 italic text-center py-8">Aucune donnée disponible</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={3}
          label={({ name, percent }: { name?: string | number; percent?: number }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatFCFA(value)} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
