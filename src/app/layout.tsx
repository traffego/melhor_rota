import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { PixelTracker } from "@/components/PixelTracker";

export const metadata: Metadata = {
  title: "Melhor Rota - Calculadora de Rotas, Pedágios e Combustível",
  description: "Calcule a melhor rota para sua viagem de carro com estimativa de consumo Inmetro, cálculo de praças de pedágios atualizadas e custo total de ida e volta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <PixelTracker />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
