"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchQuestions, questions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { scoreMatch } from "@/lib/scoring";
import { STATUS } from "@/lib/constants";

// Salva as respostas corretas das perguntas + placar e (opcionalmente) finaliza
// o jogo, disparando a correcao de todos os palpites.
export async function saveResultsAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") || "");
  const finalize = String(formData.get("finalize") || "") === "1";
  if (!matchId) return { error: "Jogo invalido." };

  const mqs = await db
    .select({ id: matchQuestions.id })
    .from(matchQuestions)
    .where(eq(matchQuestions.matchId, matchId));

  for (const mq of mqs) {
    const val = formData.get(`r_${mq.id}`);
    const resposta = val == null ? null : String(val).trim();
    await db
      .update(matchQuestions)
      .set({
        respostaCorreta: resposta && resposta.length > 0 ? resposta : null,
      })
      .where(eq(matchQuestions.id, mq.id));
  }

  const scoreARaw = formData.get("scoreA");
  const scoreBRaw = formData.get("scoreB");
  const scoreA =
    scoreARaw != null && String(scoreARaw) !== "" ? Number(scoreARaw) : null;
  const scoreB =
    scoreBRaw != null && String(scoreBRaw) !== "" ? Number(scoreBRaw) : null;

  await db
    .update(matches)
    .set({
      scoreA,
      scoreB,
      status: finalize ? STATUS.FINALIZADO : undefined,
    })
    .where(eq(matches.id, matchId));

  if (finalize) {
    await scoreMatch(matchId);
  }

  revalidatePath(`/admin/jogos/${matchId}`);
  revalidatePath("/admin");
  revalidatePath("/ranking");
  return { ok: true, finalize };
}

// Fecha manualmente o mercado de um jogo (status -> fechado).
export async function closeMarketAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") || "");
  if (!matchId) return;
  await db
    .update(matches)
    .set({ status: STATUS.FECHADO })
    .where(eq(matches.id, matchId));
  revalidatePath("/admin");
  revalidatePath(`/admin/jogos/${matchId}`);
}

// Reabre um jogo finalizado/fechado (volta para agendado).
export async function reopenMarketAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") || "");
  if (!matchId) return;
  await db
    .update(matches)
    .set({ status: STATUS.AGENDADO })
    .where(eq(matches.id, matchId));
  revalidatePath("/admin");
  revalidatePath(`/admin/jogos/${matchId}`);
}

// Atualiza dados de um jogo (uteis para os placeholders "A definir").
export async function updateMatchAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") || "");
  if (!matchId) return { error: "Jogo invalido." };
  const teamA = String(formData.get("teamA") || "").trim();
  const teamB = String(formData.get("teamB") || "").trim();
  const grupo = String(formData.get("grupo") || "").trim() || null;
  const estadio = String(formData.get("estadio") || "").trim() || null;
  const cidade = String(formData.get("cidade") || "").trim() || null;
  const kickoff = String(formData.get("kickoffAt") || "").trim();
  await db
    .update(matches)
    .set({
      teamA: teamA || undefined,
      teamB: teamB || undefined,
      grupo,
      estadio,
      cidade,
      kickoffAt: kickoff ? new Date(kickoff) : undefined,
    })
    .where(eq(matches.id, matchId));
  revalidatePath(`/admin/jogos/${matchId}`);
  return { ok: true };
}

// Atualiza os pontos de uma pergunta do pool (configuracao de pontuacao).
export async function updateQuestionPointsAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") || "");
  const pontos = Number(formData.get("pontos") || 0);
  if (!questionId || !Number.isFinite(pontos)) return;
  await db
    .update(questions)
    .set({ pontos })
    .where(eq(questions.id, questionId));
  revalidatePath("/admin/perguntas");
}
