import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
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
