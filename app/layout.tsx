import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "./components/AuthGate";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Clarity — vídeos que importam",
  description: "Uma alternativa ao feed infinito: recomendações locais, explicáveis e guiadas pela sua intenção.",
  icons: {
    icon: [{ url: `${basePath}/favicon.svg`, type: "image/svg+xml" }],
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  );
}
