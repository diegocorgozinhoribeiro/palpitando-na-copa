import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchQuestions, questions } from "@/db/schema";
import { QUESTION_POOL } from "@/data/questions";
import {
  DIFFICULTY_POINTS,
  FIXED_CODES_MATA_MATA,
  isMataMataOrdem,
} from "@/lib/constants";
import {
  updateKnockoutBracketFromFinalizedMatches,
  updateRoundOf32FromGroupStandings,
} from "@/lib/knockout";

async function main() {
  console.log("==> Garantindo novas perguntas de mata-mata no pool");
  for (const q of QUESTION_POOL) {
    await db
      .insert(questions)
      .values({
        codigo: q.codigo,
        texto: q.texto,
        tipo: q.tipo,
        dificuldade: q.dificuldade,
        pontos: DIFFICULTY_POINTS[q.dificuldade] ?? 10,
        opcoes: q.opcoes,
      })
      .onConflictDoUpdate({
        target: questions.codigo,
        set: {
          texto: q.texto,
          tipo: q.tipo,
          dificuldade: q.dificuldade,
          opcoes: q.opcoes,
          ativa: true,
        },
      });
  }

  console.log("==> Preenchendo 16 avos a partir da tabela dos grupos");
  await updateRoundOf32FromGroupStandings();

  console.log("==> Propagando confrontos a partir dos jogos finalizados");
  await updateKnockoutBracketFromFinalizedMatches();

  console.log(
    "==> Garantindo perguntas fixas nos jogos de mata-mata ja definidos",
  );
  const fixedQuestions = await db
    .select({ id: questions.id, codigo: questions.codigo })
    .from(questions)
    .where(inArray(questions.codigo, FIXED_CODES_MATA_MATA));

  const allMata = await db
    .select({ id: matches.id, ordem: matches.ordem })
    .from(matches)
    .where(eq(matches.definido, true));

  let added = 0;
  for (const m of allMata.filter((x) => isMataMataOrdem(x.ordem))) {
    const existing = await db
      .select({ codigo: questions.codigo })
      .from(matchQuestions)
      .innerJoin(questions, eq(matchQuestions.questionId, questions.id))
      .where(eq(matchQuestions.matchId, m.id));
    const existingCodes = new Set(existing.map((e) => e.codigo));
    const [{ nextOrdem }] = await db
      .select({
        nextOrdem: sql<number>`coalesce(max(${matchQuestions.ordem}), -1) + 1`,
      })
      .from(matchQuestions)
      .where(eq(matchQuestions.matchId, m.id));

    let ordem = Number(nextOrdem);
    const inserts = fixedQuestions
      .filter((q) => !existingCodes.has(q.codigo))
      .sort(
        (a, b) =>
          FIXED_CODES_MATA_MATA.indexOf(a.codigo) -
          FIXED_CODES_MATA_MATA.indexOf(b.codigo),
      )
      .map((q) => ({ matchId: m.id, questionId: q.id, ordem: ordem++ }));

    if (inserts.length > 0) {
      await db.insert(matchQuestions).values(inserts);
      added += inserts.length;
      console.log(
        `  Jogo ${m.ordem}: ${inserts.length} pergunta(s) fixa(s) adicionada(s)`,
      );
    }
  }

  console.log(`OK: ${added} pergunta(s) fixa(s) adicionada(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
