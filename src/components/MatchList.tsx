"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isMarketOpen } from "@/lib/utils";

export type MatchItem = {
  id: string;
  teamA: string;
  teamB: string;
  grupo: string | null;
  fase: string | null;
  estadio: string | null;
  kickoffAt: string; // ISO
  status: string;
  scoreA: number | null;
  scoreB: number | null;
  palpitado: boolean; // true = usuario ja preencheu todos os palpites do jogo
  pontos: number | null; // pontos do usuario na partida (null = nao palpitou)
  acertos: number | null; // acertos do usuario na partida
};

// Abas disponiveis na tela de jogos.
type Tab = "aberto" | "palpitado" | "finalizado";

// Quantos grupos de data sao exibidos antes do botao "Ver mais".
const INITIAL_GROUPS = 2;

function dateKeyBR(iso: string): string {
  // chave AAAA-MM-DD no fuso de Brasilia (para agrupar/ordenar)
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function dateLabelBR(iso: string): string {
  const s = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeBR(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

// Em qual aba cada jogo se encaixa.
function tabOf(m: MatchItem): Tab {
  if (m.status === "finalizado") return "finalizado";
  if (m.palpitado) return "palpitado";
  return "aberto";
}

function StatusBadge({
  open,
  status,
  palpitado,
}: {
  open: boolean;
  status: string;
  palpitado: boolean;
}) {
  if (status === "finalizado")
    return (
      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
        Finalizado
      </span>
    );
  if (palpitado)
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        ✓ Palpitado
      </span>
    );
  if (open)
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Aberto
      </span>
    );
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Fechado
    </span>
  );
}

export function MatchList({ matches }: { matches: MatchItem[] }) {
  const [tab, setTab] = useState<Tab>("aberto");
  const [showAll, setShowAll] = useState(false);

  // Contagem por aba (para os badges nos botoes).
  const counts = useMemo(() => {
    const c = { aberto: 0, palpitado: 0, finalizado: 0 };
    for (const m of matches) c[tabOf(m)]++;
    return c;
  }, [matches]);

  // Jogos da aba ativa, agrupados por data.
  const groups = useMemo(() => {
    const map = new Map<string, MatchItem[]>();
    for (const m of matches) {
      if (tabOf(m) !== tab) continue;
      const k = dateKeyBR(m.kickoffAt);
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => ({ key, items }));
  }, [matches, tab]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "aberto", label: "Aberto" },
    { id: "palpitado", label: "Palpitado" },
    { id: "finalizado", label: "Finalizados" },
  ];

  const visibleGroups = showAll ? groups : groups.slice(0, INITIAL_GROUPS);
  const hiddenCount = groups
    .slice(INITIAL_GROUPS)
    .reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-abas */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setShowAll(false);
              }}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-white text-brand-dark card-shadow"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {t.label}
              <span
                className={[
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
                  active ? "bg-brand-light text-brand-dark" : "text-gray-400",
                ].join(" ")}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 card-shadow">
          {tab === "aberto"
            ? "Nenhum jogo aberto no momento."
            : tab === "palpitado"
              ? "Voce ainda nao palpitou em nenhum jogo. Bora palpitar!"
              : "Nenhum jogo finalizado ainda."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {visibleGroups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold capitalize text-gray-700">
                {dateLabelBR(g.items[0].kickoffAt)}
              </h2>
              <ul className="flex flex-col gap-2">
                {g.items.map((m) => {
                  const open = isMarketOpen(m.kickoffAt, m.status);
                  const finalizado = m.status === "finalizado";
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/jogos/${m.id}`}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3 card-shadow hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">
                            {m.teamA} <span className="text-gray-400">x</span>{" "}
                            {m.teamB}
                          </div>
                          <div className="text-xs text-gray-500">
                            {m.grupo
                              ? `Grupo ${m.grupo} \u00b7 `
                              : m.fase
                                ? `${m.fase} \u00b7 `
                                : ""}
                            {timeBR(m.kickoffAt)}
                            {m.estadio ? ` \u00b7 ${m.estadio}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge
                            open={open}
                            status={m.status}
                            palpitado={m.palpitado}
                          />
                          {finalizado && m.scoreA != null && (
                            <span className="text-sm font-bold">
                              {m.scoreA}-{m.scoreB}
                            </span>
                          )}
                          {finalizado && m.pontos != null && (
                            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
                              Voce fez {m.pontos} pts
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {groups.length > INITIAL_GROUPS &&
            (showAll ? (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="mx-auto rounded-full bg-white px-5 py-2 text-sm font-medium text-gray-500 card-shadow hover:bg-gray-50"
              >
                Ver menos
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mx-auto rounded-full bg-white px-5 py-2 text-sm font-medium text-brand card-shadow hover:bg-gray-50"
              >
                Ver mais ({hiddenCount} jogos)
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
