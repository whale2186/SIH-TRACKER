import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIH 2026 Tracker",
  description: "Smart India Hackathon 2026 Problem Statement Tracker",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
