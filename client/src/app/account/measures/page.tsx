"use client";

import { useState } from "react";

type Measures = {
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  armLength: string;
  inseam: string;
  height: string;
};

const measurementFields = [
  {
    key: "chest",
    label: "Tour de poitrine",
    description: "Mesurez autour de la partie la plus large de votre poitrine",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: "waist",
    label: "Tour de taille",
    description: "Mesurez autour de votre taille naturelle (partie la plus fine)",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
      </svg>
    ),
  },
  {
    key: "hips",
    label: "Tour de hanches",
    description: "Mesurez autour de la partie la plus large de vos hanches",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    key: "shoulders",
    label: "Largeur d'epaules",
    description: "Mesurez d'une extremite de l'epaule a l'autre",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    ),
  },
  {
    key: "armLength",
    label: "Longueur de bras",
    description: "De l'epaule au poignet, bras legerement plie",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
      </svg>
    ),
  },
  {
    key: "height",
    label: "Taille (hauteur)",
    description: "Votre taille debout, pieds nus",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
  },
];

export default function MeasuresPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [measures, setMeasures] = useState<Measures>({
    chest: "",
    waist: "",
    hips: "",
    shoulders: "",
    armLength: "",
    inseam: "",
    height: "",
  });
  const [savedMeasures, setSavedMeasures] = useState<Measures | null>(null);

  const handleChange = (key: string, value: string) => {
    setMeasures((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In a real app, this would save to the API
    setSavedMeasures(measures);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (savedMeasures) {
      setMeasures(savedMeasures);
    }
    setIsEditing(false);
  };

  const hasMeasures = savedMeasures && Object.values(savedMeasures).some((v) => v);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-serif text-stone-900">Mes mesures</h2>
          <p className="text-sm text-stone-500 mt-1">
            Enregistrez vos mesures pour faciliter vos commandes
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-5 py-2.5 text-sm tracking-wide hover:bg-stone-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            {hasMeasures ? "Modifier" : "Ajouter mes mesures"}
          </button>
        )}
      </div>

      {/* Measures Form/Display */}
      <div className="bg-white rounded-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-medium text-stone-900">Mensurations</h3>
          {hasMeasures && !isEditing && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Enregistrees
            </span>
          )}
        </div>

        {!hasMeasures && !isEditing ? (
          // Empty State
          <div className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-stone-900 mb-2">
              Aucune mesure enregistree
            </h3>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Enregistrez vos mesures une seule fois pour faciliter toutes vos futures commandes sur mesure.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 text-sm tracking-wide hover:bg-stone-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ajouter mes mesures
            </button>
          </div>
        ) : (
          // Form / Display
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {measurementFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">{field.icon}</span>
                    <label className="text-sm font-medium text-stone-900">
                      {field.label}
                    </label>
                  </div>

                  {isEditing ? (
                    <>
                      <div className="relative">
                        <input
                          type="text"
                          value={measures[field.key as keyof Measures]}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder="Ex: 95"
                          className="w-full px-4 py-3 pr-12 border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                          cm
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">{field.description}</p>
                    </>
                  ) : (
                    <p className="text-stone-900 py-3">
                      {savedMeasures?.[field.key as keyof Measures] ? (
                        <span>{savedMeasures[field.key as keyof Measures]} cm</span>
                      ) : (
                        <span className="text-stone-400">Non defini</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-stone-200">
                <button
                  onClick={handleSave}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 text-sm tracking-wide hover:bg-stone-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Enregistrer
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-6 py-3 text-sm tracking-wide hover:bg-stone-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="bg-amber-50 border border-amber-100 rounded-sm p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-stone-900 mb-2">Conseils pour prendre vos mesures</h4>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>• Utilisez un metre ruban souple</li>
              <li>• Tenez-vous droit et detendu</li>
              <li>• Portez des vetements ajustes ou prenez les mesures sur la peau</li>
              <li>• Faites-vous aider pour plus de precision</li>
              <li>• En cas de doute, notre equipe peut vous guider par telephone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="bg-white rounded-sm border border-stone-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="font-medium text-stone-900 mb-1">Besoin d&apos;aide ?</h4>
            <p className="text-sm text-stone-500">
              Notre equipe peut vous guider pour prendre vos mesures correctement.
            </p>
          </div>
          <a
            href="tel:+221000000000"
            className="inline-flex items-center justify-center gap-2 border border-stone-300 text-stone-700 px-5 py-2.5 text-sm hover:bg-stone-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Nous appeler
          </a>
        </div>
      </div>
    </div>
  );
}
