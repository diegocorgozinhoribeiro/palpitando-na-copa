"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie, requireUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Politica de senha minima: 8+ caracteres com letras e numeros.
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "A senha precisa ter ao menos 8 caracteres.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw))
    return "A senha precisa conter letras e numeros.";
  return null;
}

export async function registerAction(_prev: unknown, formData: FormData) {
  // Rate limit: no maximo 5 cadastros por hora por IP.
  const ip = await getClientIp();
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok)
    return {
      error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.`,
    };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const consent = String(formData.get("consent") || "");
  const next = String(formData.get("next") || "/jogos");

  if (name.length < 2) return { error: "Informe seu nome." };
  if (!validEmail(email)) return { error: "E-mail invalido." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  if (consent !== "on")
    return {
      error: "Voce precisa aceitar a Politica de Privacidade e os Termos.",
    };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) return { error: "Esse e-mail ja esta cadastrado." };

  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(password) })
    .returning({ id: users.id });

  await setSessionCookie(created.id);
  redirect(next);
}

export async function loginAction(_prev: unknown, formData: FormData) {
  // Rate limit: no maximo 10 tentativas a cada 5 minutos por IP.
  const ip = await getClientIp();
  const rl = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.ok)
    return {
      error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.`,
    };

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/jogos");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "E-mail ou senha incorretos." };
  }
  await setSessionCookie(user.id);
  redirect(next);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

// LGPD: exclui a conta do usuario e todos os dados associados.
// As FKs com ON DELETE CASCADE removem palpites, ligas criadas e participacoes.
export async function deleteAccountAction() {
  const user = await requireUser();
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();
  redirect("/");
}
