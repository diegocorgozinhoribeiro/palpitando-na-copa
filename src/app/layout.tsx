import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Palpites da Copa",
  description: "Jogo diario de palpites da Copa do Mundo 2026",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <html lang="pt-BR">
      <body>
        <NavBar
          user={user ? { name: user.name, isAdmin: user.isAdmin } : null}
        />
        <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 py-8 text-center text-xs text-gray-400">
          Palpites da Copa · feito para a galera · horarios em Brasilia
        </footer>
      </body>
    </html>
  );
}
