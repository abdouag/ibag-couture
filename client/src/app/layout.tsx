import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ScrollRevealProvider from "@/components/ScrollRevealProvider";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import { CartProvider } from "@/contexts/CartContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Luxury serif fonts for headings
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ibagcouture.com";

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Ibag Couture | Haute Couture Africaine Sur Mesure",
    template: "%s | Ibag Couture",
  },
  description:
    "Maison de couture africaine sur mesure. Robes, costumes et tenues traditionnelles confectionnés artisanalement selon vos mesures. Livraison Afrique & Europe.",
  keywords: [
    "couture sur mesure",
    "haute couture africaine",
    "maison de couture",
    "tenue africaine",
    "robe sur mesure",
    "costume africain",
    "mode africaine",
    "création artisanale",
    "vêtement fait main",
    "Ibag Couture",
  ],
  authors: [{ name: "Ibag Couture" }],
  creator: "Ibag Couture",
  publisher: "Ibag Couture",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Ibag Couture",
    title: "Ibag Couture | Haute Couture Africaine Sur Mesure",
    description:
      "Créations sur mesure alliant traditions africaines et élégance contemporaine. Chaque pièce est confectionnée à la main, selon vos mesures exactes.",
    images: [
      {
        url: "/logo.png",
        width: 1080,
        height: 1080,
        alt: "Ibag Couture — Maison de Haute Couture Africaine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ibag Couture | Haute Couture Africaine Sur Mesure",
    description:
      "Maison de couture africaine sur mesure. Robes, costumes et tenues traditionnelles confectionnés artisanalement.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ibag Couture",
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
  category: "fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${cormorant.variable} antialiased`}
      >
        <CartProvider>
          <CustomCursor />
          <ScrollProgress />
          <Header />
          <ScrollRevealProvider />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
