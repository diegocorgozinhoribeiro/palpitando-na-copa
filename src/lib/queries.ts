import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { colocacaoPontos } from "@/lib/constants";
import {
  matches,
  matchQuestions,
  predictions,
  questions,
  users,
  leagues,
  leagueMembers,
} from "@/db/schema";

// Substitui [A] / [B] pelos nomes dos times no texto das opcoes.
export function resolveOptions(
  opcoes: string[],
  teamA: string,
  teamB: string,
): string[] {
  return opcoes.map((o) => o.replace("[A]", teamA).replace("[B]", teamB));
}

export async function getMatchWithQuestions(matchId: string) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!match) return null;
  const mqs = await db
    .select({
      mqId: matchQuestions.id,
      ordem: matchQuestions.ordem,
      respostaCorreta: matchQuestions.respostaCorreta,
      qId: questions.id,
      codigo: questions.codigo,
      texto: questions.texto,
      tipo: questions.tipo,
      dificuldade: questions.dificuldade,
      pontos: questions.pontos,
      opcoes: questions.opcoes,
      odds: matchQuestions.odds,
    })
    .from(matchQuestions)
    .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
    .where(eq(matchQuestions.matchId, matchId))
    .orderBy(asc(matchQuestions.ordem));
  return { match, questions: mqs };
}

// Palpites do usuario para um jogo (mapa matchQuestionId -> resposta).
export async function getUserPredictionsForMatch(
  userId: string,
  matchId: string,
) {
  const rows = await db
    .select({
      mqId: predictions.matchQuestionId,
      resposta: predictions.resposta,
    })
    .from(predictions)
    .innerJoin(
      matchQuestions,
      eq(predictions.matchQuestionId, matchQuestions.id),
    )
    .where(
      and(eq(predictions.userId, userId), eq(matchQuestions.matchId, matchId)),
    );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.mqId] = r.resposta;
  return map;
}

// IDs dos jogos em que o usuario ja preencheu TODOS os palpites.
// Comparamos o total de perguntas do jogo com quantas o usuario respondeu.
export async function getUserPalpitadoMatchIds(
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({
      matchId: matchQuestions.matchId,
      total: sql<number>`count(distinct ${matchQuestions.id})`,
      answered: sql<number>`count(distinct ${predictions.matchQuestionId})`,
    })
    .from(matchQuestions)
    .leftJoin(
      predictions,
      and(
        eq(predictions.matchQuestionId, matchQuestions.id),
        eq(predictions.userId, userId),
      ),
    )
    .groupBy(matchQuestions.matchId);
  return rows
    .filter(
      (r) => Number(r.total) > 0 && Number(r.total) === Number(r.answered),
    )
    .map((r) => r.matchId);
}

// Pontos (e acertos) do usuario em cada jogo. Mapa matchId -> { pontos, acertos }.
// So existe entrada para jogos em que o usuario palpitou ao menos uma vez.
export async function getUserPointsByMatch(
  userId: string,
): Promise<Record<string, { pontos: number; acertos: number }>> {
  const rows = await db
    .select({
      matchId: matchQuestions.matchId,
      pontos: sql<number>`coalesce(sum(${predictions.pontos}), 0)`,
      acertos: sql<number>`coalesce(sum(case when ${predictions.acertou} then 1 else 0 end), 0)`,
    })
    .from(predictions)
    .innerJoin(
      matchQuestions,
      eq(predictions.matchQuestionId, matchQuestions.id),
    )
    .where(eq(predictions.userId, userId))
    .groupBy(matchQuestions.matchId);
  const map: Record<string, { pontos: number; acertos: number }> = {};
  for (const r of rows)
    map[r.matchId] = {
      pontos: Number(r.pontos),
      acertos: Number(r.acertos),
    };
  return map;
}

// Proximo jogo aberto ("jogo do dia"): o de menor ordem ainda agendado.
export async function getNextOpenMatch() {
  const [m] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "agendado"), eq(matches.definido, true)))
    .orderBy(asc(matches.kickoffAt), asc(matches.ordem))
    .limit(1);
  return m ?? null;
}

export async function listMatches() {
  return db
    .select()
    .from(matches)
    .orderBy(asc(matches.kickoffAt), asc(matches.ordem));
}

// Apenas jogos ja definidos (com times reais) - usado nas telas do usuario.
export async function listVisibleMatches() {
  return db
    .select()
    .from(matches)
    .where(eq(matches.definido, true))
    .orderBy(asc(matches.kickoffAt), asc(matches.ordem));
}

// Ranking geral: soma de pontos por usuario.
export async function getGlobalRanking(limit = 100) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      pontos: sql<number>`coalesce(sum(${predictions.pontos}), 0)`.as("pontos"),
      acertos:
        sql<number>`coalesce(sum(case when ${predictions.acertou} then 1 else 0 end), 0)`.as(
          "acertos",
        ),
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`pontos`), desc(sql`acertos`))
    .limit(limit);
}

// Ranking de uma liga.
export async function getLeagueRanking(leagueId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      pontos: sql<number>`coalesce(sum(${predictions.pontos}), 0)`.as("pontos"),
      acertos:
        sql<number>`coalesce(sum(case when ${predictions.acertou} then 1 else 0 end), 0)`.as(
          "acertos",
        ),
    })
    .from(leagueMembers)
    .innerJoin(users, eq(leagueMembers.userId, users.id))
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .where(eq(leagueMembers.leagueId, leagueId))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`pontos`), desc(sql`acertos`));
}

export async function getUserLeagues(userId: string) {
  return db
    .select({
      id: leagues.id,
      nome: leagues.nome,
      codigo: leagues.codigo,
      ownerId: leagues.ownerId,
      membros:
        sql<number>`(select count(*) from ${leagueMembers} lm where lm.league_id = ${leagues.id})`.as(
          "membros",
        ),
    })
    .from(leagueMembers)
    .innerJoin(leagues, eq(leagueMembers.leagueId, leagues.id))
    .where(eq(leagueMembers.userId, userId))
    .orderBy(asc(leagues.createdAt));
}

export async function getUserTotalPoints(userId: string) {
  const [row] = await db
    .select({
      pontos: sql<number>`coalesce(sum(${predictions.pontos}), 0)`,
      acertos: sql<number>`coalesce(sum(case when ${predictions.acertou} then 1 else 0 end), 0)`,
      palpites: sql<number>`count(${predictions.id})`,
    })
    .from(predictions)
    .where(eq(predictions.userId, userId));
  return row ?? { pontos: 0, acertos: 0, palpites: 0 };
}

// ---------------------------------------------------------------------------
// RANKING POR RODADA + GERAL (pontos de colocacao)
// ---------------------------------------------------------------------------
type RankRow = {
  userId: string;
  name: string;
  pontos: number;
  acertos: number;
};

export type FullRanking = {
  rounds: number[];
  currentRound: number;
  perRound: Record<number, RankRow[]>;
  geral: RankRow[];
};

// Monta TODO o ranking (cada rodada + geral) de uma vez. Se leagueId for
// passado, restringe aos membros daquela liga; senao, ranking global.
export async function getFullRanking(leagueId?: string): Promise<FullRanking> {
  // 1) Conjunto de usuarios (todos, ou os membros da liga).
  let userIdSet: Set<string> | null = null;
  if (leagueId) {
    const mem = await db
      .select({ uid: leagueMembers.userId })
      .from(leagueMembers)
      .where(eq(leagueMembers.leagueId, leagueId));
    userIdSet = new Set(mem.map((m) => m.uid));
  }
  const allUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users);
  const nameMap = new Map(
    allUsers
      .filter((u) => !userIdSet || userIdSet.has(u.id))
      .map((u) => [u.id, u.name] as const),
  );

  // 2) Pontos/acertos/palpites por (usuario, rodada).
  const aggRows = await db
    .select({
      userId: predictions.userId,
      rodada: matches.rodada,
      pontos: sql<number>`coalesce(sum(${predictions.pontos}), 0)`,
      acertos: sql<number>`coalesce(sum(case when ${predictions.acertou} then 1 else 0 end), 0)`,
      palpites: sql<number>`count(${predictions.id})`,
    })
    .from(predictions)
    .innerJoin(
      matchQuestions,
      eq(predictions.matchQuestionId, matchQuestions.id),
    )
    .innerJoin(matches, eq(matchQuestions.matchId, matches.id))
    .groupBy(predictions.userId, matches.rodada);
  const agg = aggRows.filter((r) => r.rodada != null && nameMap.has(r.userId));

  // 3) Rodadas existentes (jogos ja definidos).
  const roundRows = await db
    .selectDistinct({ rodada: matches.rodada })
    .from(matches)
    .where(eq(matches.definido, true));
  const rounds = roundRows
    .map((r) => Number(r.rodada))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  // 4) Ranking de cada rodada (so participantes daquela rodada).
  const perRound: Record<number, RankRow[]> = {};
  for (const rd of rounds) {
    // So entra no ranking quem JA pontuou (pontos > 0). Quem apenas palpitou
    // (jogos ainda nao apurados) ou zerou tudo nao aparece.
    perRound[rd] = agg
      .filter((a) => Number(a.rodada) === rd && Number(a.pontos) > 0)
      .map((a) => ({
        userId: a.userId,
        name: String(nameMap.get(a.userId) ?? "-"),
        pontos: Number(a.pontos),
        acertos: Number(a.acertos),
      }))
      .sort((x, y) => y.pontos - x.pontos || y.acertos - x.acertos);
  }

  // 5) Ranking GERAL por pontos de colocacao.
  const totals = new Map<string, { pontos: number; acertos: number }>();
  for (const rd of rounds) {
    const rows = perRound[rd];
    let pos = 0;
    let seen = 0;
    let prevP: number | null = null;
    let prevA: number | null = null;
    for (const r of rows) {
      seen++;
      if (prevP === null || r.pontos !== prevP || r.acertos !== prevA) {
        pos = seen;
        prevP = r.pontos;
        prevA = r.acertos;
      }
      const cp = colocacaoPontos(pos);
      const t = totals.get(r.userId) ?? { pontos: 0, acertos: 0 };
      t.pontos += cp;
      t.acertos += r.acertos;
      totals.set(r.userId, t);
    }
  }
  const geral = [...totals.entries()]
    .map(([userId, t]) => ({
      userId,
      name: String(nameMap.get(userId) ?? "-"),
      pontos: t.pontos,
      acertos: t.acertos,
    }))
    .sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos);

  // 6) Rodada atual = menor rodada com jogos ainda nao finalizados.
  const openRows = await db
    .select({ rodada: matches.rodada })
    .from(matches)
    .where(
      and(eq(matches.definido, true), sql`${matches.status} <> 'finalizado'`),
    )
    .orderBy(asc(matches.rodada))
    .limit(1);
  const currentRound =
    openRows.length && openRows[0].rodada != null
      ? Number(openRows[0].rodada)
      : (rounds[rounds.length - 1] ?? 1);

  return { rounds, currentRound, perRound, geral };
}

// Contagem de palpites por opcao de cada pergunta de um jogo (distribuicao
// atual). Usado para mostrar as odds "ao vivo" no formulario de palpites.
// Retorna mapa: mqId -> { total, counts: { respostaNormalizada -> n } }.
export async function getMatchAnswerCounts(
  matchId: string,
): Promise<Record<string, { total: number; counts: Record<string, number> }>> {
  const rows = await db
    .select({
      mqId: predictions.matchQuestionId,
      resposta: predictions.resposta,
      n: sql<number>`count(*)`,
    })
    .from(predictions)
    .innerJoin(
      matchQuestions,
      eq(predictions.matchQuestionId, matchQuestions.id),
    )
    .where(eq(matchQuestions.matchId, matchId))
    .groupBy(predictions.matchQuestionId, predictions.resposta);

  const out: Record<string, { total: number; counts: Record<string, number> }> =
    {};
  for (const r of rows) {
    const key = normalizeAnswer(r.resposta);
    const entry = out[r.mqId] ?? { total: 0, counts: {} };
    entry.counts[key] = (entry.counts[key] ?? 0) + Number(r.n);
    entry.total += Number(r.n);
    out[r.mqId] = entry;
  }
  return out;
}

function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

void inArray;
