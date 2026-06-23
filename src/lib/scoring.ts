import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchQuestions, predictions, questions } from "@/db/schema";
import { NO_ODD_CODES } from "@/lib/constants";
import { oddFor, pontosForOdd, round2 } from "@/lib/odds";
import { resolveOptions } from "@/lib/queries";

// Corrige todos os palpites de UMA pergunta de jogo, com base na resposta
// correta ja gravada em match_questions.respostaCorreta.
//
// Rodada 1: pontuacao classica (acertou -> pontos base da pergunta).
// Rodada 2+: sistema de ODD (base x odd, com teto). "placar_exato" fica fora
// da odd e paga sempre a base.
export async function scoreMatchQuestion(
  matchQuestionId: string,
): Promise<void> {
  const [mq] = await db
    .select({
      id: matchQuestions.id,
      respostaCorreta: matchQuestions.respostaCorreta,
      pontos: questions.pontos,
      codigo: questions.codigo,
      opcoes: questions.opcoes,
      rodada: matches.rodada,
      teamA: matches.teamA,
      teamB: matches.teamB,
    })
    .from(matchQuestions)
    .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
    .innerJoin(matches, eq(matchQuestions.matchId, matches.id))
    .where(eq(matchQuestions.id, matchQuestionId))
    .limit(1);

  if (!mq || mq.respostaCorreta == null) return;

  const palpites = await db
    .select()
    .from(predictions)
    .where(eq(predictions.matchQuestionId, matchQuestionId));

  const correta = normalize(mq.respostaCorreta);
  const usaOdd = (mq.rodada ?? 1) >= 2 && !NO_ODD_CODES.includes(mq.codigo);

  // --- Rodada 1 (ou perguntas fora da odd): pontuacao classica ---
  if (!usaOdd) {
    for (const p of palpites) {
      const acertou = normalize(p.resposta) === correta;
      await db
        .update(predictions)
        .set({ acertou, pontos: acertou ? mq.pontos : 0 })
        .where(eq(predictions.id, p.id));
    }
    return;
  }

  // --- Rodada 2+: sistema de ODD ---
  const total = palpites.length;
  const counts = new Map<string, number>();
  for (const p of palpites) {
    const key = normalize(p.resposta);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const k = Math.max(mq.opcoes?.length ?? 0, counts.size, 1);

  // Guarda as odds por opcao (resolvidas com nomes dos times) para exibicao.
  const resolved = resolveOptions(mq.opcoes ?? [], mq.teamA, mq.teamB);
  const oddsByOption: Record<string, number> = {};
  for (const opt of resolved) {
    const n = counts.get(normalize(opt)) ?? 0;
    oddsByOption[opt] = round2(oddFor(n, total, k));
  }
  if (Object.keys(oddsByOption).length > 0) {
    await db
      .update(matchQuestions)
      .set({ odds: oddsByOption })
      .where(eq(matchQuestions.id, mq.id));
  }

  const nCorrect = counts.get(correta) ?? 0;
  const oddCorrect = oddFor(nCorrect, total, k);
  const pontosAcerto = pontosForOdd(mq.pontos, oddCorrect);

  for (const p of palpites) {
    const acertou = normalize(p.resposta) === correta;
    await db
      .update(predictions)
      .set({ acertou, pontos: acertou ? pontosAcerto : 0 })
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
  const raw = s.trim().toLowerCase();

  // Tratamento especial para placar exato.
  // Considera equivalentes formatos como:
  //   2x1, 2 x 1, 2-1, 2 : 1, 02x01, 2 a 1
  const score = raw.match(/^(\d+)\s*(?:x|-|:|a)\s*(\d+)$/i);
  if (score) {
    return `${Number(score[1])}-${Number(score[2])}`;
  }

  return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
