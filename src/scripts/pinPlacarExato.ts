import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, questions, matchQuestions } from "@/db/schema";

// Garante que a pergunta 'placar_exato' esteja presente nos jogos FUTUROS
// (ainda agendados). Para jogos ja sorteados que nao tem a pergunta, troca
// uma pergunta nao-fixa por 'placar_exato', mantendo 6 perguntas por jogo.
//
// ATENCAO: a troca apaga os palpites feitos naquele slot especifico (poucos,
// pois sao jogos que ainda nao comecaram). Os demais palpites sao preservados.
//
// Uso: npm run db:pin-placar
async function run() {
  const [placar] = await db
    .select()
    .from(questions)
    .where(eq(questions.codigo, "placar_exato"))
    .limit(1);
  if (!placar)
    throw new Error(
      "Pergunta 'placar_exato' nao encontrada. Rode o seed antes (npm run seed).",
    );

  // Apenas jogos definidos e ainda agendados (nao comecaram).
  const upcoming = await db
    .select({ id: matches.id, ordem: matches.ordem })
    .from(matches)
    .where(and(eq(matches.status, "agendado"), eq(matches.definido, true)));

  let changed = 0;
  for (const m of upcoming) {
    const mqs = await db
      .select({
        id: matchQuestions.id,
        ordem: matchQuestions.ordem,
        codigo: questions.codigo,
      })
      .from(matchQuestions)
      .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
      .where(eq(matchQuestions.matchId, m.id));

    if (mqs.length === 0) continue; // ainda nao sorteado
    if (mqs.some((q) => q.codigo === "placar_exato")) continue; // ja tem

    // Escolhe a pergunta a substituir: a de maior ordem que nao seja fixa.
    const candidates = mqs
      .filter((q) => q.codigo !== "vencedor")
      .sort((a, b) => b.ordem - a.ordem);
    const target = candidates[0] ?? mqs[mqs.length - 1];

    // Apaga o slot antigo (cascade remove palpites desse slot) e insere o placar.
    await db.delete(matchQuestions).where(eq(matchQuestions.id, target.id));
    await db.insert(matchQuestions).values({
      matchId: m.id,
      questionId: placar.id,
      ordem: target.ordem,
    });
    changed++;
  }

  console.log(`placar_exato fixado em ${changed} jogo(s) futuro(s).`);
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
