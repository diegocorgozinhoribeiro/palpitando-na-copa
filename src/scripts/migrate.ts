import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Migracao idempotente que NAO usa drizzle-kit push (ele falha com
// "column id is in a primary key" / 42P16 ao recriar constraints).
// Roda SQL puro no Neon: adiciona colunas novas, limpa duplicatas,
// garante a constraint unica em ordem e re-sorteia 6 perguntas por jogo.
// Uso: npm run db:migrate  (depois: npm run seed)
async function main() {
  console.log("==> 1/6 Adicionando colunas novas (fase, definido)");
  await db.execute(sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS fase text`);
  await db.execute(
    sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS definido boolean NOT NULL DEFAULT true`,
  );

  console.log("==> 2/6 Removendo jogos duplicados (mantem 1 por ordem)");
  await db.execute(sql`
    DELETE FROM matches WHERE id IN (
      SELECT id FROM (
        SELECT id, row_number() OVER (
          PARTITION BY ordem ORDER BY created_at, id
        ) AS rn
        FROM matches
      ) t WHERE t.rn > 1
    )
  `);

  console.log("==> 3/6 Removendo jogos extras alem dos 104 oficiais");
  await db.execute(sql`DELETE FROM matches WHERE ordem > 104`);

  console.log("==> 4/6 Garantindo constraint unica em matches.ordem");
  await db.execute(sql`DO $$ BEGIN
    ALTER TABLE matches ADD CONSTRAINT matches_ordem_unique UNIQUE (ordem);
  EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
  END $$`);

  console.log(
    "==> 5/6 Limpando perguntas sorteadas (e palpites) para re-sortear 6 por jogo",
  );
  // ON DELETE CASCADE em predictions cuida dos palpites ligados.
  await db.execute(sql`DELETE FROM match_questions`);

  console.log("==> 6/6 Garantindo demais constraints unicas");
  await db.execute(sql`DO $$ BEGIN
    ALTER TABLE match_questions
      ADD CONSTRAINT match_questions_match_id_question_id_unique UNIQUE (match_id, question_id);
  EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
  END $$`);
  await db.execute(sql`DO $$ BEGIN
    ALTER TABLE league_members
      ADD CONSTRAINT league_members_league_id_user_id_unique UNIQUE (league_id, user_id);
  EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
  END $$`);

  console.log("\nMigracao concluida com sucesso. Agora rode: npm run seed");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
