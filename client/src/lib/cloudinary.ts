const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Options = {
  /** Largeur cible en pixels */
  w?: number;
  /** Hauteur cible en pixels */
  h?: number;
  /** Mode de recadrage Cloudinary (fill, limit, fit...) */
  crop?: string;
};

/**
 * Construit l'URL d'une image produit a la taille voulue.
 *
 * Les photos du catalogue sont stockees en haute resolution sur Cloudinary
 * (jusqu'a 750 Ko). Les servir telles quelles sur mobile penalise le temps de
 * chargement, donc le taux de rebond du trafic publicitaire. Cloudinary sait
 * redimensionner et convertir a la volee (`f_auto` choisit WebP/AVIF selon le
 * navigateur, `q_auto` ajuste la compression) : il suffit d'inserer les
 * transformations dans l'URL, sans passer par l'optimiseur d'images de Vercel.
 *
 * Une URL qui n'est pas hebergee sur Cloudinary est renvoyee telle quelle.
 */
export function cloudinaryUrl(url: string | undefined | null, options: Options = {}): string {
  if (!url) return "";

  const absolute = url.startsWith("http") || url.startsWith("data:") ? url : `${API_URL}${url}`;

  if (!absolute.includes("res.cloudinary.com") || !absolute.includes("/upload/")) {
    return absolute;
  }

  const transformations = ["f_auto", "q_auto"];
  if (options.w) transformations.push(`w_${options.w}`);
  if (options.h) transformations.push(`h_${options.h}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  return absolute.replace("/upload/", `/upload/${transformations.join(",")}/`);
}
