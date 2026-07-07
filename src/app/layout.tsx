import type { Metadata, Viewport } from "next";
import { HelpdeskWidget } from "@/features/helpdesk/components/helpdesk-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Tank Monitoring System",
  description:
    "Fondasi aplikasi monitoring telemetri tangki bahan bakar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <HelpdeskWidget />
      </body>
    </html>
  );
}
