import type { Metadata } from "next";
import { Geist_Mono, Lexend } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Church Members",
  description: "Member portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
