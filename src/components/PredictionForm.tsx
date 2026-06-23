"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAllPredictionsAction } from "@/app/jogos/actions";

type Card = {
  mqId: string;
  texto: string;
  tipo: string;
  dificuldade: string;
  pontos: number;
  opcoes: string[];
  respostaCorreta: string | null;
  minhaResposta: string | null;
  // Rodada 2+: pontos que cada opcao paga (base x odd). null = sem odd.
  odds?: Record<string, number> | null;
};

const DIFF_LABEL: Record<string, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

function Countdown({ closeAt }: { closeAt: number }) {
  const [left, setLeft] = useState(closeAt - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(closeAt - Date.now()), 1000);
    return () => clearInterval(t);
  }, [closeAt]);
  if (left <= 0)
    return <span className="font-semibold text-red-600">Mercado fechado</span>;
  const totalSec = Math.floor(left / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const txt =
    d > 0
      ? `${d}d ${h}h ${m}m`
      : `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return <span className="font-semibold text-brand-dark">Fecha em {txt}</span>;
}

export function PredictionForm({
  matchId,
  cards,
  open,
  finalizado,
  rodada,
  closeAt,
}: {
  matchId: string;
  cards: Card[];
  open: boolean;
  finalizado: boolean;
  rodada?: number;
  closeAt: number;
}) {
  const usaOdd = (rodada ?? 1) >= 2;
  const [state, formAction, pending] = useActionState(
    saveAllPredictionsAction,
    undefined,
  );
  const [picks, setPicks] = useState<Record<string, string>>(
    Object.fromEntries(
      cards
        .filter((c) => c.minhaResposta)
        .map((c) => [c.mqId, c.minhaResposta as string]),
    ),
  );

  const disabled = !open || finalizado;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />

      {usaOdd && (
        <div className="rounded-lg bg-accent/15 px-4 py-3 text-sm text-brand-dark">
          <span className="font-semibold">Rodada com ODD ⚡</span> — quanto
          menos gente escolher uma opção, mais pontos ela paga se você acertar.
          Os pontos mostrados são uma projeção; vale a odd no fechamento do
          mercado.
          {finalizado ? " (valores finais)" : ""}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-brand-light px-4 py-2 text-sm">
        <span>{cards.length} palpites neste jogo</span>
        {finalizado ? (
          <span className="font-semibold text-gray-600">Jogo finalizado</span>
        ) : (
          <Countdown closeAt={closeAt} />
        )}
      </div>

      {cards.map((c, idx) => {
        const isTwoSide = c.tipo === "mais_menos" || c.tipo === "sim_nao";
        const placar = c.tipo === "placar";
        const acertou =
          finalizado &&
          c.respostaCorreta &&
          c.minhaResposta &&
          normalize(c.minhaResposta) === normalize(c.respostaCorreta);
        return (
          <div key={c.mqId} className="rounded-xl bg-white p-4 card-shadow">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                Pergunta {idx + 1} · {DIFF_LABEL[c.dificuldade]} · {c.pontos}{" "}
                pts
              </span>
              {finalizado && c.respostaCorreta && (
                <span
                  className={
                    acertou
                      ? "text-xs font-bold text-green-600"
                      : "text-xs font-bold text-red-500"
                  }
                >
                  {acertou ? `+${c.pontos}` : "0"} · gabarito:{" "}
                  {c.respostaCorreta}
                </span>
              )}
            </div>
            <div className="mb-3 font-semibold">{c.texto}</div>

            {placar ? (
              <input
                name={`q_${c.mqId}`}
                defaultValue={c.minhaResposta ?? ""}
                placeholder="Ex: 2-1"
                disabled={disabled}
                onChange={(e) =>
                  setPicks((p) => ({ ...p, [c.mqId]: e.target.value }))
                }
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-center font-bold disabled:bg-gray-100"
              />
            ) : (
              <div
                className={
                  isTwoSide
                    ? "grid grid-cols-2 gap-2"
                    : "grid grid-cols-1 gap-2"
                }
              >
                {c.opcoes.map((opt) => {
                  const selected = picks[c.mqId] === opt;
                  const simNaoColor =
                    c.tipo === "sim_nao"
                      ? opt === "Sim"
                        ? "sim"
                        : "nao"
                      : null;
                  const optPts = c.odds ? c.odds[opt] : null;
                  return (
                    <button
                      type="button"
                      key={opt}
                      disabled={disabled}
                      onClick={() => setPicks((p) => ({ ...p, [c.mqId]: opt }))}
                      className={[
                        "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                        selected
                          ? "border-brand bg-brand text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-brand",
                        disabled ? "opacity-60" : "",
                        !selected && simNaoColor === "sim"
                          ? "hover:bg-green-50"
                          : "",
                        !selected && simNaoColor === "nao"
                          ? "hover:bg-red-50"
                          : "",
                      ].join(" ")}
                    >
                      <span>{opt}</span>
                      {optPts != null && (
                        <span
                          className={[
                            "text-xs font-bold",
                            selected ? "text-white" : "text-accent",
                          ].join(" ")}
                        >
                          paga {optPts} pts
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {/* valor efetivamente enviado para opcoes (botoes) */}
            {!placar && (
              <input
                type="hidden"
                name={`q_${c.mqId}`}
                value={picks[c.mqId] ?? ""}
              />
            )}
          </div>
        );
      })}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {!disabled && (
        <button
          disabled={pending}
          className="sticky bottom-3 rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar palpites"}
        </button>
      )}
      {disabled && !finalizado && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
          O mercado deste jogo está fechado. Não é mais possível palpitar.
        </p>
      )}
    </form>
  );
}

function normalize(s: string): string {
  const raw = s.trim().toLowerCase();

  // Mesmo tratamento do backend: 2x1, 2 x 1, 2-1, 2:1, 02x01 e 2 a 1
  // contam como o mesmo placar.
  const score = raw.match(/^(\d+)\s*(?:x|-|:|a)\s*(\d+)$/i);
  if (score) {
    return `${Number(score[1])}-${Number(score[2])}`;
  }

  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
