import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastContextProvider } from "@/components/ui/Toast";

/* ---------- Fonts ---------- */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

/* ---------- Metadata ---------- */
export const metadata: Metadata = {
  title: {
    default: "CoU DineX — Smart University Cafeteria",
    template: "%s | CoU DineX",
  },
  description:
    "Smart university cafeteria, food ordering and campus delivery management system for Comilla University. Order food, track delivery, and manage campus dining — all in one place.",
  keywords: [
    "CoU DineX",
    "Comilla University",
    "university cafeteria",
    "food ordering",
    "campus delivery",
    "student food",
  ],
  authors: [{ name: "CoU DineX Team" }],
  creator: "CoU DineX",
  openGraph: {
    title: "CoU DineX — Smart University Cafeteria",
    description: "Your Campus. Your Food. Your Time.",
    type: "website",
    locale: "en_BD",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F766E" },
    { media: "(prefers-color-scheme: dark)", color: "#071A19" },
  ],
};

/* ---------- Root Layout ---------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansBengali.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastContextProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ToastContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
