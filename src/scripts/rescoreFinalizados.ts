import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { STATUS } from "@/lib/constants";
import { scoreMatch } from "@/lib/scoring";

async function main() {
  console.log("==> Recorrigindo jogos finalizados");
  const rows = await db
    .select({
      id: matches.id,
      ordem: matches.ordem,
      teamA: matches.teamA,
      teamB: matches.teamB,
    })
    .from(matches)
    .where(eq(matches.status, STATUS.FINALIZADO));

  console.log(`Jogos finalizados encontrados: ${rows.length}`);
  for (const m of rows) {
    console.log(`- Jogo ${m.ordem}: ${m.teamA} x ${m.teamB}`);
    await scoreMatch(m.id);
  }
  console.log("OK: palpites recorrigidos.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
