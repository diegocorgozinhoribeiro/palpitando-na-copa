import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Migracao ADITIVA e NAO destrutiva: cria apenas a tabela password_resets
// (usada pelo fluxo de "esqueci minha senha"). Nao apaga nenhum dado.
// Rode uma vez em producao:  npm run db:add-password-resets
async function main() {
  console.log("==> Criando tabela password_resets (se nao existir)");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      used_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  console.log("Pronto! Tabela password_resets criada/garantida.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
