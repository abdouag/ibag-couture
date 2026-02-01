export default function DeliveryInfo() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-50 to-amber-50/50 border border-emerald-200/60 p-4 md:p-5">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 md:w-5.5 md:h-5.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-stock-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm md:text-base font-semibold text-emerald-800">
                Livraison rapide &agrave; Dakar
              </span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-stone-600 leading-relaxed">
            Recevez votre commande en <strong className="text-stone-800">24&ndash;72h ouvrables</strong> sur tous les produits
          </p>
        </div>
      </div>
    </div>
  );
}
