import "dotenv/config";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { rodadaForOrdem } from "@/lib/constants";

// Script ADITIVO e idempotente (seguro para rodar em producao):
// 1) garante as colunas novas (matches.rodada, match_questions.odds);
// 2) preenche matches.rodada a partir da ordem do jogo.
// NAO apaga nada. Pode ser rodado quantas vezes quiser.
async function main() {
  console.log("==> Garantindo colunas novas (ADD COLUMN IF NOT EXISTS)");
  await db.execute(
    sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS rodada integer`,
  );
  await db.execute(
    sql`ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS odds jsonb`,
  );

  console.log("==> Preenchendo matches.rodada a partir da ordem");
  const all = await db
    .select({ id: matches.id, ordem: matches.ordem })
    .from(matches);
  let n = 0;
  for (const m of all) {
    await db
      .update(matches)
      .set({ rodada: rodadaForOrdem(m.ordem) })
      .where(eq(matches.id, m.id));
    n++;
  }
  console.log(`    ${n} jogos atualizados com a rodada.`);
  console.log("==> Concluido.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
