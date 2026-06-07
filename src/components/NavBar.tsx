import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export function NavBar({
  user,
}: {
  user: { name: string; isAdmin: boolean } | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/jogos" : "/"}
          className="flex items-center gap-2 font-bold text-brand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.png"
            alt="Palpitando na Copa"
            className="h-8 w-8 rounded-md object-contain"
          />
          <span>Palpitando na Copa</span>
        </Link>
        {user ? (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/jogos" className="hover:text-brand">
              Jogos
            </Link>
            <Link href="/ligas" className="hover:text-brand">
              Ligas
            </Link>
            <Link href="/ranking" className="hover:text-brand">
              Ranking
            </Link>
            {user.isAdmin && (
              <Link
                href="/admin"
                className="font-semibold text-brand-dark hover:underline"
              >
                Admin
              </Link>
            )}
            <Link href="/perfil" className="hover:text-brand">
              {user.name.split(" ")[0]}
            </Link>
            <form action={logoutAction}>
              <button className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                Sair
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
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
    </header>
  );
}
