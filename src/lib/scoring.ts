import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matchQuestions, predictions, questions } from "@/db/schema";

// Corrige todos os palpites de UMA pergunta de jogo, com base na resposta
// correta ja gravada em match_questions.respostaCorreta.
export async function scoreMatchQuestion(
  matchQuestionId: string,
): Promise<void> {
  const [mq] = await db
    .select({
      id: matchQuestions.id,
      respostaCorreta: matchQuestions.respostaCorreta,
      pontos: questions.pontos,
    })
    .from(matchQuestions)
    .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
    .where(eq(matchQuestions.id, matchQuestionId))
    .limit(1);

  if (!mq || mq.respostaCorreta == null) return;

  const palpites = await db
    .select()
    .from(predictions)
    .where(eq(predictions.matchQuestionId, matchQuestionId));

  const correta = normalize(mq.respostaCorreta);
  for (const p of palpites) {
    const acertou = normalize(p.resposta) === correta;
    await db
      .update(predictions)
      .set({ acertou, pontos: acertou ? mq.pontos : 0 })
      .where(eq(predictions.id, p.id));
  }
}

// Corrige todas as perguntas de um jogo (usado ao finalizar a partida).
export async function scoreMatch(matchId: string): Promise<void> {
  const mqs = await db
    .select({ id: matchQuestions.id })
    .from(matchQuestions)
    .where(eq(matchQuestions.matchId, matchId));
  for (const mq of mqs) {
    await scoreMatchQuestion(mq.id);
  }
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
