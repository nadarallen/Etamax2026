import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GalaxyBackground from "../components/GalaxyBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Etamax 2026",
  description: "Etamax 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GalaxyBackground>
          {children}
        </GalaxyBackground>
      </body>
    </html>
  );
}
