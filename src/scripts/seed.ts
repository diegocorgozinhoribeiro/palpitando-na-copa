import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@/db";
import { questions, matches } from "@/db/schema";
import { QUESTION_POOL } from "@/data/questions";
import { DIFFICULTY_POINTS } from "@/lib/constants";
import { drawQuestionsForAllMatches } from "./draw";

async function main() {
  console.log("==> Seed: pool de perguntas");
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
      .onConflictDoNothing({ target: questions.codigo });
  }
  console.log(`    ${QUESTION_POOL.length} perguntas garantidas.`);

  console.log("==> Seed: jogos");
  const file = resolve(process.cwd(), "src/data/matches.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as Array<
    Record<string, unknown>
  >;
  for (const m of data) {
    const vals = {
      ordem: m.ordem as number,
      fase: (m.fase as string) ?? null,
      teamA: m.teamA as string,
      teamB: m.teamB as string,
      grupo: (m.grupo as string) ?? null,
      estadio: (m.estadio as string) ?? null,
      cidade: (m.cidade as string) ?? null,
      kickoffAt: new Date(m.kickoffAt as string),
      definido: (m.definido as boolean) ?? true,
    };
    // Upsert por ordem: idempotente. Se o jogo ja existe, atualiza os dados
    // (times/datas/fase/definido) sem mexer em status/placar do admin.
    await db
      .insert(matches)
      .values({ ...vals, status: (m.status as string) ?? "agendado" })
      .onConflictDoUpdate({
        target: matches.ordem,
        set: {
          fase: vals.fase,
          teamA: vals.teamA,
          teamB: vals.teamB,
          grupo: vals.grupo,
          estadio: vals.estadio,
          cidade: vals.cidade,
          kickoffAt: vals.kickoffAt,
          definido: vals.definido,
        },
      });
  }
  console.log(`    ${data.length} jogos garantidos.`);

  console.log(
    "==> Sorteio de 6 perguntas por jogo (quem vence + 5, iguais para todos)",
  );
  const drawn = await drawQuestionsForAllMatches();
  console.log(`    Sorteio concluido para ${drawn} jogo(s).`);

  console.log("Seed finalizado com sucesso.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
