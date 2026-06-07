import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Promove um usuario a admin pelo e-mail.
// Uso: tsx src/scripts/makeAdmin.ts email@exemplo.com
async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error(
      "Informe o e-mail: tsx src/scripts/makeAdmin.ts email@exemplo.com",
    );
    process.exit(1);
  }
  const res = await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.email, email))
    .returning({ id: users.id });
  if (res.length === 0) {
    console.error("Usuario nao encontrado. Cadastre-se no app primeiro.");
    process.exit(1);
  }
  console.log(`Usuario ${email} agora e admin.`);
  process.exit(0);
}
main();
