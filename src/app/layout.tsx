import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import "@fontsource-variable/mona-sans/wght.css";
import "./globals.css";

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
      className={`${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
