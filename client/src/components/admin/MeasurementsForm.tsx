"use client";

import { useState } from "react";

type CustomMeasurement = {
  label: string;
  value: number | "";
};

type Measurements = {
  shoulders: number | "";
  chest: number | "";
  waist: number | "";
  hips: number | "";
  boubouLength: number | "";
  pantsLength: number | "";
  sleeveLength: number | "";
  customMeasurements: CustomMeasurement[];
  notes: string;
};

type Props = {
  measurements: Measurements;
  onChange: (measurements: Measurements) => void;
};

const STANDARD_FIELDS: { key: keyof Omit<Measurements, "customMeasurements" | "notes">; label: string; placeholder: string }[] = [
  { key: "shoulders", label: "Épaules", placeholder: "cm" },
  { key: "chest", label: "Poitrine", placeholder: "cm" },
  { key: "waist", label: "Taille", placeholder: "cm" },
  { key: "hips", label: "Hanches", placeholder: "cm" },
  { key: "boubouLength", label: "Longueur boubou", placeholder: "cm" },
  { key: "pantsLength", label: "Longueur pantalon", placeholder: "cm" },
  { key: "sleeveLength", label: "Longueur manche", placeholder: "cm" },
];

export const emptyMeasurements: Measurements = {
  shoulders: "",
  chest: "",
  waist: "",
  hips: "",
  boubouLength: "",
  pantsLength: "",
  sleeveLength: "",
  customMeasurements: [],
  notes: "",
};

export type { Measurements, CustomMeasurement };

export default function MeasurementsForm({ measurements, onChange }: Props) {
  const updateField = (key: string, value: number | string) => {
    onChange({ ...measurements, [key]: value });
  };

  const addCustom = () => {
    onChange({
      ...measurements,
      customMeasurements: [...measurements.customMeasurements, { label: "", value: "" }],
    });
  };

  const updateCustom = (index: number, field: "label" | "value", val: string | number) => {
    const updated = [...measurements.customMeasurements];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...measurements, customMeasurements: updated });
  };

  const removeCustom = (index: number) => {
    const updated = measurements.customMeasurements.filter((_, i) => i !== index);
    onChange({ ...measurements, customMeasurements: updated });
  };

  return (
    <div className="space-y-6">
      {/* Mesures standard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {STANDARD_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              {label}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={measurements[key]}
                onChange={(e) => updateField(key, e.target.value === "" ? "" : parseFloat(e.target.value))}
                placeholder={placeholder}
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">cm</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mesures personnalisées */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-stone-700">Mesures personnalisées</h4>
          <button
            type="button"
            onClick={addCustom}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </div>

        {measurements.customMeasurements.length > 0 && (
          <div className="space-y-3">
            {measurements.customMeasurements.map((custom, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={custom.label}
                  onChange={(e) => updateCustom(index, "label", e.target.value)}
                  placeholder="Nom de la mesure"
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <div className="relative w-28">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={custom.value}
                    onChange={(e) => updateCustom(index, "value", e.target.value === "" ? "" : parseFloat(e.target.value))}
                    placeholder="cm"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">cm</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCustom(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes mesures */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Notes sur les mesures
        </label>
        <textarea
          value={measurements.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Préférences, retouches, commentaires..."
          rows={3}
          className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
