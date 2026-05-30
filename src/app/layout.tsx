import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Beacon — Surgical Operations AI Platform",
  description: "AI-powered surgical readiness monitoring, coordination, and briefing generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="ml-60 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
