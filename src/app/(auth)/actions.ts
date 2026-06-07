"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerAction(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/jogos");

  if (name.length < 2) return { error: "Informe seu nome." };
  if (!validEmail(email)) return { error: "E-mail invalido." };
  if (password.length < 6)
    return { error: "A senha precisa ter ao menos 6 caracteres." };

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
