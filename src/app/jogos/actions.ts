"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchQuestions, predictions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isMarketOpen } from "@/lib/utils";

// Salva (ou atualiza) o palpite de um usuario para uma pergunta de jogo.
// Valida no SERVIDOR que o mercado ainda esta aberto.
export async function savePredictionAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const matchQuestionId = String(formData.get("matchQuestionId") || "");
  const resposta = String(formData.get("resposta") || "").trim();
  if (!matchQuestionId || !resposta) return { error: "Palpite invalido." };

  // Descobre o jogo dessa pergunta e checa o mercado.
  const [row] = await db
    .select({
      matchId: matchQuestions.matchId,
      kickoffAt: matches.kickoffAt,
      status: matches.status,
    })
    .from(matchQuestions)
    .innerJoin(matches, eq(matchQuestions.matchId, matches.id))
    .where(eq(matchQuestions.id, matchQuestionId))
    .limit(1);
  if (!row) return { error: "Pergunta nao encontrada." };

  if (!isMarketOpen(row.kickoffAt, row.status)) {
    return { error: "Mercado fechado para esse jogo." };
  }

  await db
    .insert(predictions)
    .values({ userId: user.id, matchQuestionId, resposta })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.matchQuestionId],
      set: { resposta },
    });

  revalidatePath(`/jogos/${row.matchId}`);
  return { ok: true };
}

// Salva todos os palpites de um jogo de uma vez (formulario com 5 cards).
export async function saveAllPredictionsAction(
  _prev: unknown,
  formData: FormData,
) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") || "");
  if (!matchId) return { error: "Jogo invalido." };

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!match) return { error: "Jogo nao encontrado." };
  if (!isMarketOpen(match.kickoffAt, match.status)) {
    return { error: "Mercado fechado para esse jogo." };
  }

  const mqs = await db
    .select({ id: matchQuestions.id })
    .from(matchQuestions)
    .where(eq(matchQuestions.matchId, matchId));

  for (const mq of mqs) {
    const resposta = String(formData.get(`q_${mq.id}`) || "").trim();
    if (!resposta) continue;
    await db
      .insert(predictions)
      .values({ userId: user.id, matchQuestionId: mq.id, resposta })
      .onConflictDoUpdate({
        target: [predictions.userId, predictions.matchQuestionId],
        set: { resposta },
      });
  }

  revalidatePath(`/jogos/${matchId}`);
  revalidatePath("/jogos");
  // Apos salvar, volta para a lista de jogos para o usuario escolher o proximo.
  redirect("/jogos");
}

void and;
