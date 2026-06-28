"use client";

import { useState } from "react";
import { RankingTable } from "./RankingTable";

type Row = { userId: string; name: string; pontos: number; acertos: number };

export function RankingTabs({
  rounds,
  currentRound,
  perRound,
  geral,
  highlightUserId,
}: {
  rounds: number[];
  currentRound: number;
  perRound: Record<number, Row[]>;
  geral: Row[];
  highlightUserId?: string;
}) {
  const [tab, setTab] = useState<string>(String(currentRound));

  const tabs = [
    ...rounds.map((r) => ({
      key: String(r),
      label: `Rodada ${r}${r === currentRound ? " (Atual)" : ""}`,
    })),
    { key: "geral", label: "Geral" },
  ];

  const isGeral = tab === "geral";
  const rows = isGeral ? geral : (perRound[Number(tab)] ?? []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-white text-brand-dark card-shadow"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500">
        {isGeral
          ? "Ranking geral por pontos de colocacao: a cada rodada voce ganha pontos conforme sua posicao naquela rodada. Some tudo para liderar o campeonato."
          : "Pontuacao somada apenas desta rodada. Cada rodada recomeca do zero."}
      </p>

      <RankingTable rows={rows} highlightUserId={highlightUserId} />
    </div>
  );
}
