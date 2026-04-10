import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AZAT Platform — Управление с/х техникой",
  description: "Платформа для управления парком с/х техники, планирования работ и маркетплейса аренды оборудования",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AZAT Platform",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
