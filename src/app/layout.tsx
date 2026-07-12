import type { Metadata, Viewport } from "next";
import { HelpdeskWidget } from "@/features/helpdesk/components/helpdesk-widget";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "FTM",
  title: "FTM - Fuel Tank Management",
  description:
    "Fondasi aplikasi manajemen telemetri tangki bahan bakar.",
  manifest: "/manifest.json",
  icons: {
    apple: [
      {
        sizes: "57x57",
        type: "image/png",
        url: "/logo/apple-icon-57x57.png",
      },
      {
        sizes: "60x60",
        type: "image/png",
        url: "/logo/apple-icon-60x60.png",
      },
      {
        sizes: "72x72",
        type: "image/png",
        url: "/logo/apple-icon-72x72.png",
      },
      {
        sizes: "76x76",
        type: "image/png",
        url: "/logo/apple-icon-76x76.png",
      },
      {
        sizes: "114x114",
        type: "image/png",
        url: "/logo/apple-icon-114x114.png",
      },
      {
        sizes: "120x120",
        type: "image/png",
        url: "/logo/apple-icon-120x120.png",
      },
      {
        sizes: "144x144",
        type: "image/png",
        url: "/logo/apple-icon-144x144.png",
      },
      {
        sizes: "152x152",
        type: "image/png",
        url: "/logo/apple-icon-152x152.png",
      },
      {
        sizes: "180x180",
        type: "image/png",
        url: "/logo/apple-icon-180x180.png",
      },
    ],
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        sizes: "16x16",
        type: "image/png",
        url: "/logo/favicon-16x16.png",
      },
      {
        sizes: "32x32",
        type: "image/png",
        url: "/logo/favicon-32x32.png",
      },
      {
        sizes: "96x96",
        type: "image/png",
        url: "/logo/favicon-96x96.png",
      },
      {
        sizes: "192x192",
        type: "image/png",
        url: "/logo/android-icon-192x192.png",
      },
    ],
    shortcut: [
      {
        url: "/favicon.ico",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FTM",
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/logo/ms-icon-144x144.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <HelpdeskWidget />
      </body>
    </html>
  );
}
