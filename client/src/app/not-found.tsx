import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-[#C9A45C] text-[10px] uppercase tracking-[0.3em] mb-6">
          Ibag Couture
        </p>
        <h1 className="font-luxury text-7xl md:text-9xl text-[#C9A45C] mb-4">
          404
        </h1>
        <p className="text-white/60 text-lg md:text-xl mb-2">
          Cette page n&apos;existe pas
        </p>
        <p className="text-white/30 text-sm mb-10">
          La page que vous recherchez a peut-être été déplacée ou supprimée.
        </p>
        <Link
          href="/collections"
          className="btn-luxury-gold inline-flex"
        >
          Retour aux collections
        </Link>
      </div>
    </div>
  );
}
