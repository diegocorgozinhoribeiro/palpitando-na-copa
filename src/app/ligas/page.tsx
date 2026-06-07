import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserLeagues } from "@/lib/queries";
import { leaveLeagueAction } from "./actions";
import { LeagueForms } from "@/components/LeagueForms";
import { MAX_LEAGUES_PER_USER } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LigasPage() {
  const user = await requireUser();
  const ligas = await getUserLeagues(user.id);
  const atingiuLimite = ligas.length >= MAX_LEAGUES_PER_USER;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Minhas ligas</h1>
        <p className="text-sm text-gray-500">
          Voce participa de {ligas.length} de {MAX_LEAGUES_PER_USER} ligas.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {ligas.map((l) => (
          <li
            key={l.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 card-shadow"
          >
            <div>
              <Link
                href={`/ligas/${l.codigo}`}
                className="font-semibold hover:text-brand"
              >
                {l.nome}
              </Link>
              <div className="text-xs text-gray-500">
                Código{" "}
                <span className="font-mono font-semibold">{l.codigo}</span> ·{" "}
                {l.membros} membro(s)
                {l.ownerId === user.id ? " · você é o dono" : ""}
              </div>
            </div>
            <form action={leaveLeagueAction}>
              <input type="hidden" name="leagueId" value={l.id} />
              <button className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                {l.ownerId === user.id ? "Excluir" : "Sair"}
              </button>
            </form>
          </li>
        ))}
        {ligas.length === 0 && (
          <p className="text-sm text-gray-400">
            Voce ainda nao participa de nenhuma liga.
          </p>
        )}
      </ul>

      <LeagueForms
        atingiuLimite={atingiuLimite}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || ""}
      />
    </div>
  );
}
