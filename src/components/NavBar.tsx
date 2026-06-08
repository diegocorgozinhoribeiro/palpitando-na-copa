"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";

export function NavBar({
  user,
}: {
  user: { name: string; isAdmin: boolean } | null;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const Links = () => (
    <>
      <Link href="/jogos" onClick={close} className="hover:text-brand">
        Jogos
      </Link>
      <Link href="/ligas" onClick={close} className="hover:text-brand">
        Ligas
      </Link>
      <Link href="/ranking" onClick={close} className="hover:text-brand">
        Ranking
      </Link>
      {user?.isAdmin && (
        <Link
          href="/admin"
          onClick={close}
          className="font-semibold text-brand-dark hover:underline"
        >
          Admin
        </Link>
      )}
      <Link href="/perfil" onClick={close} className="hover:text-brand">
        {user ? user.name.split(" ")[0] : ""}
      </Link>
      <form action={logoutAction}>
        <button className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
          Sair
        </button>
      </form>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/jogos" : "/"}
          onClick={close}
          className="flex items-center gap-2 font-bold text-brand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.png"
            alt="Palpitando na Copa"
            className="h-8 w-8 shrink-0 rounded-md object-contain"
          />
          <span className="hidden sm:inline">Palpitando na Copa</span>
          <span className="sm:hidden">Palpitando</span>
        </Link>

        {user ? (
          <>
            {/* Navegação no desktop */}
            <nav className="hidden items-center gap-3 text-sm md:flex">
              <Links />
            </nav>
            {/* Botão hambúrguer no mobile */}
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-600 md:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <>
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          </>
        ) : (
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/login" className="hover:text-brand">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
            >
              Criar conta
            </Link>
          </nav>
        )}
      </div>

      {/* Painel suspenso no mobile */}
      {user && open && (
        <nav className="flex flex-col items-start gap-3 border-t border-gray-100 px-4 py-3 text-sm md:hidden">
          <Links />
        </nav>
      )}
    </header>
  );
}
