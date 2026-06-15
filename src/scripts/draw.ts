import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, questions, matchQuestions } from "@/db/schema";
import { QUESTIONS_PER_MATCH } from "@/lib/constants";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia QUESTIONS_PER_MATCH perguntas para um jogo, garantindo que as
// perguntas FIXAS ('vencedor' e 'placar_exato') sempre estejam presentes.
const FIXED_CODES = ["vencedor", "placar_exato"];
export async function drawQuestionsForMatch(matchId: string): Promise<boolean> {
  const existing = await db
    .select({ id: matchQuestions.id })
    .from(matchQuestions)
    .where(eq(matchQuestions.matchId, matchId));
  if (existing.length > 0) return false; // ja sorteado; nao re-sorteia

  const pool = await db
    .select()
    .from(questions)
    .where(eq(questions.ativa, true));
  if (pool.length === 0)
    throw new Error("Pool de perguntas vazio. Rode o seed antes.");

  // Perguntas fixas primeiro (na ordem definida em FIXED_CODES).
  const fixas = FIXED_CODES.map((code) =>
    pool.find((q) => q.codigo === code),
  ).filter((q): q is (typeof pool)[number] => Boolean(q));
  const resto = shuffle(pool.filter((q) => !FIXED_CODES.includes(q.codigo)));

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
