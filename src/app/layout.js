import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HyperspaceBackground } from "@/components/ui/hyperspace-background";

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
        <div className="relative min-h-screen w-full overflow-x-hidden">
          <div className="fixed inset-0 z-0">
            <HyperspaceBackground />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
