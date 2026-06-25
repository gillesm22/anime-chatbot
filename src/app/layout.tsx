import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Anime Chatbot",
  description: "Chat with Arisu, Marin, and Nao",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0d12" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased" suppressHydrationWarning>
        <OfflineIndicator />
        <script dangerouslySetInnerHTML={{ __html: `
          // Suppress hydration error overlay in dev
          if (typeof window !== 'undefined') {
            const origError = console.error;
            console.error = function(...args) {
              if (typeof args[0] === 'string' && (args[0].includes('Hydration') || args[0].includes('hydrat'))) return;
              origError.apply(console, args);
            };
          }
        `}} />
        {children}
      </body>
    </html>
  );
}
