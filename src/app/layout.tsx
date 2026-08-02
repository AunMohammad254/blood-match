import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import dynamic from "next/dynamic";

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
      <body className={`font-sans transition-colors duration-200`}>
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
