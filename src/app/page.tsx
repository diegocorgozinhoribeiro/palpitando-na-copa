import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/jogos");
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="text-6xl">⚽</div>
      <h1 className="text-3xl font-extrabold text-gray-900">
        Palpites da Copa do Mundo
      </h1>
      <p className="max-w-md text-gray-600">
        Um jogo por dia. Escolha o card que voce acha que vai acontecer, dispute
        com os amigos em ligas privadas e suba no ranking. Palpite ate 1 minuto
        antes do apito.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          Criar conta grátis
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-100"
        >
          Já tenho conta
        </Link>
      </div>
      <div className="mt-6 grid w-full max-w-lg grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-white p-4 card-shadow">
          <div className="text-2xl">🎯</div>5 palpites por jogo
        </div>
        <div className="rounded-lg bg-white p-4 card-shadow">
          <div className="text-2xl">🏆</div>Ligas com amigos
        </div>
        <div className="rounded-lg bg-white p-4 card-shadow">
          <div className="text-2xl">⚡</div>Ranking ao vivo
        </div>
      </div>
    </div>
  );
}
