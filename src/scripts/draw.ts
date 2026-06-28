import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, questions, matchQuestions } from "@/db/schema";
import {
  FIXED_CODES_DEFAULT,
  FIXED_CODES_MATA_MATA,
  QUESTIONS_PER_MATCH,
  isMataMataOrdem,
} from "@/lib/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia QUESTIONS_PER_MATCH perguntas para um jogo, garantindo perguntas
// fixas. No mata-mata entram perguntas especificas: classificado,
// prorrogacao e disputa de penaltis.
export async function drawQuestionsForMatch(matchId: string): Promise<boolean> {
  const existing = await db
    .select({ id: matchQuestions.id })
    .from(matchQuestions)
    .where(eq(matchQuestions.matchId, matchId));
  if (existing.length > 0) return false; // ja sorteado; nao re-sorteia

  const [match] = await db
    .select({ ordem: matches.ordem })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!match) return false;

  const fixedCodes = isMataMataOrdem(match.ordem)
    ? FIXED_CODES_MATA_MATA
    : FIXED_CODES_DEFAULT;

  const pool = await db
    .select()
    .from(questions)
    .where(eq(questions.ativa, true));
  if (pool.length === 0)
    throw new Error("Pool de perguntas vazio. Rode o seed antes.");

  // Perguntas fixas primeiro (na ordem definida em FIXED_CODES).
  const fixas = fixedCodes
    .map((code) => pool.find((q) => q.codigo === code))
    .filter((q): q is (typeof pool)[number] => Boolean(q));
  const resto = shuffle(pool.filter((q) => !fixedCodes.includes(q.codigo)));

  const escolhidas = [...fixas];
  for (const q of resto) {
    if (escolhidas.length >= QUESTIONS_PER_MATCH) break;
    escolhidas.push(q);
  }

  await db.insert(matchQuestions).values(
    escolhidas.map((q, i) => ({
      matchId,
      questionId: q.id,
      ordem: i,
    })),
  );
  return true;
}

export async function drawQuestionsForAllMatches(): Promise<number> {
  // Sorteia apenas para jogos ja definidos (com times reais).
  const all = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.definido, true));
  let count = 0;
  for (const m of all) {
    const did = await drawQuestionsForMatch(m.id);
    if (did) count++;
  }
  return count;
}

// Permite rodar manualmente: tsx src/scripts/draw.ts
if (process.argv[1] && process.argv[1].includes("draw")) {
  const _run = sql; // evita import nao usado em alguns bundlers
  void _run;
  drawQuestionsForAllMatches()
    .then((n) => {
      console.log(`Sorteio concluido para ${n} jogo(s).`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
