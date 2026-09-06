import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Invait · Operations overview",
  description: "Адаптивная панель управления Telegram-инфраструктурой.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
