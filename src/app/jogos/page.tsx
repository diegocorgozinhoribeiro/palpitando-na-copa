import { listVisibleMatches, getUserPalpitadoMatchIds } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { MatchList } from "@/components/MatchList";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const user = await getCurrentUser();
  const [all, palpitadoIds] = await Promise.all([
    listVisibleMatches(),
    user ? getUserPalpitadoMatchIds(user.id) : Promise.resolve<string[]>([]),
  ]);
  const palpitadoSet = new Set(palpitadoIds);
  const items = all.map((m) => ({
    id: m.id,
    teamA: m.teamA,
    teamB: m.teamB,
    grupo: m.grupo,
    fase: m.fase,
    estadio: m.estadio,
    kickoffAt: new Date(m.kickoffAt).toISOString(),
    status: m.status,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    palpitado: palpitadoSet.has(m.id),
  }));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Jogos</h1>
      <p className="text-sm text-gray-500">
        Palpite ate 1 minuto antes do apito. Toque em um jogo para abrir os
        cards.
      </p>
      <MatchList matches={items} />
    </div>
  );
}
