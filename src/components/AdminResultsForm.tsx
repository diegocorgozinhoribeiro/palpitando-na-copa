"use client";

import { useActionState } from "react";
import { saveResultsAction } from "@/app/admin/actions";

type Card = {
  mqId: string;
  texto: string;
  tipo: string;
  pontos: number;
  opcoes: string[];
  respostaCorreta: string | null;
};

export function AdminResultsForm({
  matchId,
  cards,
  scoreA,
  scoreB,
  finalizado,
}: {
  matchId: string;
  cards: Card[];
  scoreA: number | null;
  scoreB: number | null;
  finalizado: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveResultsAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="rounded-xl bg-white p-4 card-shadow">
        <div className="mb-2 font-semibold">Placar final</div>
        <div className="flex items-center gap-2">
          <input
            name="scoreA"
            type="number"
            min={0}
            defaultValue={scoreA ?? ""}
            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center"
          />
          <span className="font-bold">x</span>
          <input
            name="scoreB"
            type="number"
            min={0}
            defaultValue={scoreB ?? ""}
            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center"
          />
        </div>
      </div>

      {cards.map((c, idx) => (
        <div key={c.mqId} className="rounded-xl bg-white p-4 card-shadow">
          <div className="mb-1 text-xs font-medium text-gray-400">
            Pergunta {idx + 1} · {c.pontos} pts
          </div>
          <div className="mb-2 font-semibold">{c.texto}</div>
          {c.tipo === "placar" ? (
            <input
              name={`r_${c.mqId}`}
              defaultValue={c.respostaCorreta ?? ""}
              placeholder="Ex: 2-1"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-center"
            />
          ) : (
            <select
              name={`r_${c.mqId}`}
              defaultValue={c.respostaCorreta ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">— selecione a resposta correta —</option>
              {c.opcoes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && "ok" in state && state.ok && (
        <p className="text-sm text-green-600">
          {state.finalize
            ? "Jogo finalizado e palpites corrigidos! ✅"
            : "Gabarito salvo (rascunho)."}
        </p>
      )}

      <div className="sticky bottom-3 flex gap-2">
        <button
          name="finalize"
          value="0"
          disabled={pending}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Salvar rascunho
        </button>
        <button
          name="finalize"
          value="1"
          disabled={pending}
          className="flex-1 rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending
            ? "Processando..."
            : finalizado
              ? "Recorrigir palpites"
              : "Finalizar e corrigir"}
        </button>
      </div>
    </form>
  );
}
