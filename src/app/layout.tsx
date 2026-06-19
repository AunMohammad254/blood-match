import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

// Lazily load the heavy AI ChatBot component to improve initial LCP/TTI
const AiChatBot = dynamic(() => import("@/components/AiChatBot"), { 
  ssr: false,
  loading: () => null // Hide until loaded to prevent layout shift
});

export const metadata: Metadata = {
  title: "BloodMatch — Blood Donation Emergency Matching System",
  description:
    "BloodMatch connects blood donors with patients in emergencies — fast, accurate, and free.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          {/* Global AI Assistant — available on every page */}
          <AiChatBot />
          {/* Global toast notification system */}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
