import type { Metadata, Viewport } from "next";
import "@fontsource/playfair-display/700-italic.css";
import "@fontsource/playfair-display/800-italic.css";
import "@fontsource-variable/dm-sans/index.css";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pink Petal — Mini Photobooth",
  description:
    "A little frame, a lot of florals. Take photos with your own camera, dress them in pretty frames and stickers, and download your photo strip. Everything stays on your device.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFEBEF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <SessionProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold text-petal focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
