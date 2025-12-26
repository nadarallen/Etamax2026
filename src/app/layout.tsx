import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as requested in Prompt 2
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Etamax - College Fest Platform",
  description: "The ultimate platform for college events, teams, and fun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " antialiased bg-gray-50 text-gray-900"}>
        {children}
      </body>
    </html>
  );
}
