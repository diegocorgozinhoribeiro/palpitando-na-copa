import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getMatchWithQuestions,
  getMatchAnswerCounts,
  getUserPredictionsForMatch,
  resolveOptions,
} from "@/lib/queries";
import { isMarketOpen, formatDateBR, marketCloseTime } from "@/lib/utils";
import { NO_ODD_CODES } from "@/lib/constants";
import { oddFor, pontosForOdd } from "@/lib/odds";
import { PredictionForm } from "@/components/PredictionForm";

function normalizeStr(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  const finalizado = match.status === "finalizado";
  const rodada = match.rodada ?? 1;
  const myPredictions = await getUserPredictionsForMatch(user.id, id);

  // Para a Rodada 2+, calculamos os pontos que cada opcao paga (base x odd).
  // Enquanto o mercado esta aberto, usamos a distribuicao ATUAL (projecao);
  // depois de finalizado, usamos as odds finais gravadas na apuracao.
  const counts = rodada >= 2 ? await getMatchAnswerCounts(id) : {};

  const cards = questions.map((q) => {
    const opcoes = resolveOptions(q.opcoes ?? [], match.teamA, match.teamB);
    const usaOdd =
      rodada >= 2 && q.tipo !== "placar" && !NO_ODD_CODES.includes(q.codigo);
    let odds: Record<string, number> | null = null;
    if (usaOdd) {
      odds = {};
      if (finalizado && q.odds) {
        for (const opt of opcoes) {
          const o = q.odds[opt];
          odds[opt] = o ? pontosForOdd(q.pontos, o) : q.pontos;
        }
      } else {
        const info = counts[q.mqId] ?? { total: 0, counts: {} };
        const k = Math.max(opcoes.length, Object.keys(info.counts).length, 1);
        for (const opt of opcoes) {
          const n = info.counts[normalizeStr(opt)] ?? 0;
          odds[opt] = pontosForOdd(q.pontos, oddFor(n, info.total, k));
        }
      }
    }
    return {
      mqId: q.mqId,
      texto: q.texto,
      tipo: q.tipo,
      dificuldade: q.dificuldade,
      pontos: q.pontos,
      opcoes,
      respostaCorreta: q.respostaCorreta,
      minhaResposta: myPredictions[q.mqId] ?? null,
      odds,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5 text-center card-shadow">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          {match.grupo ? `Grupo ${match.grupo}` : "Copa do Mundo"}
          {match.rodada ? ` · Rodada ${match.rodada}` : ""}
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
        finalizado={finalizado}
        rodada={rodada}
        closeAt={marketCloseTime(match.kickoffAt)}
      />
    </div>
  );
}
