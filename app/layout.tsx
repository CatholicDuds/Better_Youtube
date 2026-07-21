import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "./components/AuthGate";

export const metadata: Metadata = {
  title: "Clarity — vídeos que importam",
  description: "Uma alternativa ao feed infinito: recomendações locais, explicáveis e guiadas pela sua intenção.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
