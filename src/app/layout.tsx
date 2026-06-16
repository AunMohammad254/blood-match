import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import AiChatBot from "@/components/AiChatBot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BloodMatch — Blood Donation Emergency Matching System",
  description:
    "BloodMatch connects blood donors with patients in emergencies — fast, accurate, and free.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        {/* Global AI Assistant — available on every page */}
        <AiChatBot />
      </body>
    </html>
  );
}
