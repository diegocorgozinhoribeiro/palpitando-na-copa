import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getMatchWithQuestions,
  getUserPredictionsForMatch,
  resolveOptions,
} from "@/lib/queries";
import { isMarketOpen, formatDateBR, marketCloseTime } from "@/lib/utils";
import { PredictionForm } from "@/components/PredictionForm";

export const dynamic = "force-dynamic";

export default async function JogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getMatchWithQuestions(id);
  if (!data) notFound();
  const { match, questions } = data;
  if (!match.definido) notFound();
  const open = isMarketOpen(match.kickoffAt, match.status);
  const myPredictions = await getUserPredictionsForMatch(user.id, id);

  const cards = questions.map((q) => ({
    mqId: q.mqId,
    texto: q.texto,
    tipo: q.tipo,
    dificuldade: q.dificuldade,
    pontos: q.pontos,
    opcoes: resolveOptions(q.opcoes ?? [], match.teamA, match.teamB),
    respostaCorreta: q.respostaCorreta,
    minhaResposta: myPredictions[q.mqId] ?? null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5 text-center card-shadow">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          {match.grupo ? `Grupo ${match.grupo}` : "Copa do Mundo"}
        </div>
        <div className="my-2 text-xl font-extrabold">
          {match.teamA} <span className="text-gray-300">x</span> {match.teamB}
        </div>
        <div className="text-sm text-gray-500">
          {formatDateBR(match.kickoffAt)}
          {match.estadio ? ` · ${match.estadio}` : ""}
        </div>
        {match.status === "finalizado" && match.scoreA != null && (
          <div className="mt-2 text-2xl font-black text-brand">
            {match.scoreA} - {match.scoreB}
          </div>
        )}
      </div>

      <PredictionForm
        matchId={match.id}
        cards={cards}
        open={open}
        finalizado={match.status === "finalizado"}
        closeAt={marketCloseTime(match.kickoffAt)}
      />
    </div>
  );
}
