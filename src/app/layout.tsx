import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FOLLICAD | Péče začíná porozuměním",
  description:
    "Poznejte své vlasy. Začněte krátkým screeningem zdarma a zorientujte se v možnostech další péče.",
};

export const viewport: Viewport = {
  themeColor: "#28788A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
