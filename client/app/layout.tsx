import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/lib/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareConnect — Smart Healthcare Platform",
  description: "AI-enabled healthcare platform connecting patients with doctors for smart, seamless care.",
  keywords: ["healthcare", "telemedicine", "doctors", "appointments", "CareConnect"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-text font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
