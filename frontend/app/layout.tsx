import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeController } from "@/components/layout/ThemeController";

export const metadata: Metadata = {
  title: "Local AI Knowledge Space",
  description: "Local-first AI workspace for documents, RAG search, graphing, and derived notes"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeController />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
