import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SplashScreen } from "@/components/SplashScreen";
import { BloodDripCanvas } from "@/components/BloodDripCanvas";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Anime Chatbot",
  description: "Chat with five unique anime companions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var stored = localStorage.getItem("anime-chatbot-theme-mode");
              if (stored === "light" || stored === "dark") {
                document.documentElement.setAttribute("data-theme", stored);
              } else {
                var h = new Date().getHours();
                document.documentElement.setAttribute("data-theme", (h >= 18 || h < 6) ? "dark" : "light");
              }
            } catch(e) {}
          })();
        `}</Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0d12" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-bg text-text antialiased overflow-hidden" suppressHydrationWarning>
        <SplashScreen />
        <OfflineIndicator />
        <Script id="dev-init" strategy="beforeInteractive">{`
          if (typeof window !== 'undefined') {
            var origError = console.error;
            console.error = function() {
              if (typeof arguments[0] === 'string' && (arguments[0].includes('Hydration') || arguments[0].includes('hydrat'))) return;
              origError.apply(console, arguments);
            };
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(regs) {
                regs.forEach(function(reg) { reg.unregister(); });
              });
              if (typeof caches !== 'undefined') {
                caches.keys().then(function(keys) {
                  keys.forEach(function(k) { caches.delete(k); });
                });
              }
            }
          }
        `}</Script>
        <BloodDripCanvas />
        {children}
      </body>
    </html>
  );
}
