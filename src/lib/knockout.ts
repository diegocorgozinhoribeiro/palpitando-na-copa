import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchQuestions, questions } from "@/db/schema";
import { STATUS, isMataMataOrdem } from "@/lib/constants";
import { drawQuestionsForMatch } from "@/scripts/draw";

export type BracketSlot = "teamA" | "teamB";

type BracketTarget = {
  source: number;
  target: number;
  slot: BracketSlot;
  kind: "winner" | "loser";
};

// Chave oficial cadastrada em matches.json.
// Quando um jogo e finalizado, o vencedor/perdedor preenche automaticamente
// os slots dos proximos confrontos.
const BRACKET: BracketTarget[] = [
  { source: 74, target: 89, slot: "teamA", kind: "winner" },
  { source: 77, target: 89, slot: "teamB", kind: "winner" },
  { source: 73, target: 90, slot: "teamA", kind: "winner" },
  { source: 75, target: 90, slot: "teamB", kind: "winner" },
  { source: 76, target: 91, slot: "teamA", kind: "winner" },
  { source: 78, target: 91, slot: "teamB", kind: "winner" },
  { source: 79, target: 92, slot: "teamA", kind: "winner" },
  { source: 80, target: 92, slot: "teamB", kind: "winner" },
  { source: 83, target: 93, slot: "teamA", kind: "winner" },
  { source: 84, target: 93, slot: "teamB", kind: "winner" },
  { source: 81, target: 94, slot: "teamA", kind: "winner" },
  { source: 82, target: 94, slot: "teamB", kind: "winner" },
  { source: 86, target: 95, slot: "teamA", kind: "winner" },
  { source: 88, target: 95, slot: "teamB", kind: "winner" },
  { source: 85, target: 96, slot: "teamA", kind: "winner" },
  { source: 87, target: 96, slot: "teamB", kind: "winner" },

  { source: 89, target: 97, slot: "teamA", kind: "winner" },
  { source: 90, target: 97, slot: "teamB", kind: "winner" },
  { source: 93, target: 98, slot: "teamA", kind: "winner" },
  { source: 94, target: 98, slot: "teamB", kind: "winner" },
  { source: 91, target: 99, slot: "teamA", kind: "winner" },
  { source: 92, target: 99, slot: "teamB", kind: "winner" },
  { source: 95, target: 100, slot: "teamA", kind: "winner" },
  { source: 96, target: 100, slot: "teamB", kind: "winner" },

  { source: 97, target: 101, slot: "teamA", kind: "winner" },
  { source: 98, target: 101, slot: "teamB", kind: "winner" },
  { source: 99, target: 102, slot: "teamA", kind: "winner" },
  { source: 100, target: 102, slot: "teamB", kind: "winner" },

  { source: 101, target: 104, slot: "teamA", kind: "winner" },
  { source: 102, target: 104, slot: "teamB", kind: "winner" },
  { source: 101, target: 103, slot: "teamA", kind: "loser" },
  { source: 102, target: 103, slot: "teamB", kind: "loser" },
];

export function isPlaceholderTeam(team: string | null | undefined): boolean {
  const t = (team ?? "").trim().toLowerCase();
  if (!t) return true;
  return (
    t.includes("vencedor jogo") ||
    t.includes("perdedor jogo") ||
    t.includes("a definir") ||
    /^\d+[a-l]$/.test(t) ||
    /^\d+[a-l]+/.test(t)
  );
}

export function isMatchDefinedByTeams(teamA: string, teamB: string): boolean {
  return !isPlaceholderTeam(teamA) && !isPlaceholderTeam(teamB);
}

export async function updateKnockoutBracketAfterMatch(matchId: string) {
  const [source] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!source || !isMataMataOrdem(source.ordem)) return;
  if (source.status !== STATUS.FINALIZADO) return;

  const targets = BRACKET.filter((b) => b.source === source.ordem);
  if (targets.length === 0) return;

  const result = await resolveKnockoutResult(source);
  if (!result) return;

  for (const t of targets) {
    const team = t.kind === "winner" ? result.winner : result.loser;
    await fillBracketSlot(t.target, t.slot, team);
  }
}

export async function updateKnockoutBracketFromFinalizedMatches() {
  const finalized = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.status, STATUS.FINALIZADO),
        inArray(matches.ordem, [...new Set(BRACKET.map((b) => b.source))]),
      ),
    )
    .orderBy(asc(matches.ordem));

  // Rodar em ordem natural para propagar 16 avos -> oitavas -> quartas...
  for (const m of finalized) {
    await updateKnockoutBracketAfterMatch(m.id);
  }
}

// Preenche os 16 avos (jogos 73-88) a partir da tabela dos grupos.
// - 1A/2A/etc. sao resolvidos diretamente pela classificacao do grupo;
// - vagas de 3o lugar (ex.: 3ABCDF) usam os 8 melhores terceiros e escolhem,
//   de forma deterministica, o melhor terceiro ainda disponivel permitido pelo slot.
export async function updateRoundOf32FromGroupStandings() {
  const groupMatches = await db
    .select()
    .from(matches)
    .where(
      inArray(
        matches.ordem,
        Array.from({ length: 72 }, (_, i) => i + 1),
      ),
    );

  const groups = new Map<string, Map<string, Standing>>();
  for (const m of groupMatches) {
    if (!m.grupo || m.status !== STATUS.FINALIZADO) continue;
    if (m.scoreA == null || m.scoreB == null) continue;
    const g = groups.get(m.grupo) ?? new Map<string, Standing>();
    ensureStanding(g, m.teamA);
    ensureStanding(g, m.teamB);
    const a = g.get(m.teamA)!;
    const b = g.get(m.teamB)!;
    a.gf += m.scoreA;
    a.ga += m.scoreB;
    b.gf += m.scoreB;
    b.ga += m.scoreA;
    if (m.scoreA > m.scoreB) {
      a.pts += 3;
      a.wins += 1;
    } else if (m.scoreB > m.scoreA) {
      b.pts += 3;
      b.wins += 1;
    } else {
      a.pts += 1;
      b.pts += 1;
    }
    groups.set(m.grupo, g);
  }

  const sortedGroups = new Map<string, Standing[]>();
  for (const [g, table] of groups.entries()) {
    const rows = [...table.values()].sort(compareStanding);
    // So usa grupo com tabela completa de 4 selecoes e 6 jogos finalizados.
    if (rows.length >= 4) sortedGroups.set(g, rows);
  }

  const thirds = [...sortedGroups.entries()]
    .map(([grupo, rows]) => ({ ...rows[2], grupo }))
    .sort(compareStanding);
  const qualifiedThirds = thirds.slice(0, 8);
  const usedThirdGroups = new Set<string>();

  const roundOf32 = await db
    .select()
    .from(matches)
    .where(
      inArray(
        matches.ordem,
        Array.from({ length: 16 }, (_, i) => i + 73),
      ),
    );

  for (const m of roundOf32) {
    const teamA = resolveGroupSlot(
      m.teamA,
      sortedGroups,
      qualifiedThirds,
      usedThirdGroups,
    );
    const teamB = resolveGroupSlot(
      m.teamB,
      sortedGroups,
      qualifiedThirds,
      usedThirdGroups,
    );
    if (!teamA && !teamB) continue;
    const nextTeamA = teamA ?? m.teamA;
    const nextTeamB = teamB ?? m.teamB;
    const definido = isMatchDefinedByTeams(nextTeamA, nextTeamB);
    await db
      .update(matches)
      .set({ teamA: nextTeamA, teamB: nextTeamB, definido })
      .where(eq(matches.id, m.id));
    if (definido) await drawQuestionsForMatch(m.id);
  }
}

async function resolveKnockoutResult(source: typeof matches.$inferSelect) {
  const scoreA = source.scoreA;
  const scoreB = source.scoreB;
  if (scoreA != null && scoreB != null && scoreA > scoreB) {
    return { winner: source.teamA, loser: source.teamB };
  }
  if (scoreA != null && scoreB != null && scoreB > scoreA) {
    return { winner: source.teamB, loser: source.teamA };
  }

  // Se o placar ficou empatado (prorrogacao/penaltis), usa a resposta correta
  // da pergunta fixa "Quem classifica?".
  const [classified] = await db
    .select({ resposta: matchQuestions.respostaCorreta })
    .from(matchQuestions)
    .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
    .where(
      and(
        eq(matchQuestions.matchId, source.id),
        eq(questions.codigo, "classificado"),
      ),
    )
    .limit(1);

  const answer = (classified?.resposta ?? "").trim();
  if (!answer) return null;
  if (sameTeam(answer, source.teamA)) {
    return { winner: source.teamA, loser: source.teamB };
  }
  if (sameTeam(answer, source.teamB)) {
    return { winner: source.teamB, loser: source.teamA };
  }
  return null;
}

async function fillBracketSlot(ordem: number, slot: BracketSlot, team: string) {
  const [target] = await db
    .select()
    .from(matches)
    .where(eq(matches.ordem, ordem))
    .limit(1);
  if (!target) return;

  const nextTeamA = slot === "teamA" ? team : target.teamA;
  const nextTeamB = slot === "teamB" ? team : target.teamB;
  const definido = isMatchDefinedByTeams(nextTeamA, nextTeamB);

  await db
    .update(matches)
    .set({
      teamA: nextTeamA,
      teamB: nextTeamB,
      definido,
    })
    .where(eq(matches.id, target.id));

  if (definido) {
    await drawQuestionsForMatch(target.id);
  }
}

function sameTeam(a: string, b: string): boolean {
  return normalizeTeam(a) === normalizeTeam(b);
}

function normalizeTeam(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Standing = {
  team: string;
  pts: number;
  wins: number;
  gf: number;
  ga: number;
};

function ensureStanding(table: Map<string, Standing>, team: string) {
  if (!table.has(team)) {
    table.set(team, { team, pts: 0, wins: 0, gf: 0, ga: 0 });
  }
}

function compareStanding(a: Standing, b: Standing) {
  return (
    b.pts - a.pts ||
    b.gf - b.ga - (a.gf - a.ga) ||
    b.gf - a.gf ||
    b.wins - a.wins ||
    a.team.localeCompare(b.team)
  );
}

function resolveGroupSlot(
  slot: string,
  groups: Map<string, Standing[]>,
  thirds: Array<Standing & { grupo: string }>,
  usedThirdGroups: Set<string>,
): string | null {
  const s = slot.trim().toUpperCase();
  const direct = s.match(/^([12])([A-L])$/);
  if (direct) {
    const pos = Number(direct[1]) - 1;
    const group = direct[2];
    return groups.get(group)?.[pos]?.team ?? null;
  }

  const third = s.match(/^3([A-L]+)$/);
  if (third) {
    const allowed = new Set(third[1].split(""));
    const chosen = thirds.find(
      (t) => allowed.has(t.grupo) && !usedThirdGroups.has(t.grupo),
    );
    if (!chosen) return null;
    usedThirdGroups.add(chosen.grupo);
    return chosen.team;
  }
  return null;
}
