import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Remove jogos duplicados, mantendo o registro mais antigo de cada "ordem".
// Ao apagar um jogo, as perguntas sorteadas e palpites ligados a ele saem
// junto (ON DELETE CASCADE). Rode UMA vez para limpar duplicatas que ja
// entraram, depois rode `npm run db:push` para criar a restricao UNIQUE em
// matches.ordem (a partir dai o seed nunca mais duplica).
async function main() {
  const before = await db.execute(sql`SELECT count(*)::int AS n FROM matches`);
  const total = (before.rows?.[0] as { n: number } | undefined)?.n ?? "?";

  await db.execute(sql`
    DELETE FROM matches
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               row_number() OVER (PARTITION BY ordem ORDER BY created_at, id) AS rn
        FROM matches
      ) t
      WHERE t.rn > 1
    )
  `);

  const after = await db.execute(sql`SELECT count(*)::int AS n FROM matches`);
  const restantes = (after.rows?.[0] as { n: number } | undefined)?.n ?? "?";

  console.log(`Jogos antes: ${total} -> depois: ${restantes}`);
  console.log(
    "Duplicatas removidas. Agora rode: npm run db:push  (cria o UNIQUE em ordem)",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
