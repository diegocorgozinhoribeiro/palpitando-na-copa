"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie, requireUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/mailer";

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

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// "Esqueci minha senha": gera um token, salva o hash e envia o link por e-mail.
// Sempre retorna sucesso generico para nao revelar quais e-mails existem.
export async function requestPasswordResetAction(
  _prev: unknown,
  formData: FormData,
) {
  const ip = await getClientIp();
  const rl = rateLimit(`reset-request:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.ok)
    return {
      error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.`,
    };

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!validEmail(email)) return { error: "E-mail invalido." };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // valido por 1 hora
    await db
      .insert(passwordResets)
      .values({ userId: user.id, tokenHash, expiresAt });

    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${base.replace(/\/$/, "")}/redefinir-senha?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Redefinir sua senha - Palpitando na Copa",
      text: `Voce pediu para redefinir sua senha no Palpitando na Copa.\n\nAbra o link abaixo (valido por 1 hora):\n${link}\n\nSe nao foi voce, ignore este e-mail.`,
      html: `<p>Voce pediu para redefinir sua senha no <strong>Palpitando na Copa</strong>.</p><p><a href="${link}">Clique aqui para criar uma nova senha</a> (link valido por 1 hora).</p><p>Se nao foi voce, pode ignorar este e-mail.</p>`,
    });
  }

  return { ok: true };
}

// Define a nova senha a partir de um token valido.
export async function resetPasswordAction(_prev: unknown, formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "Link invalido." };
  const pwError = validatePassword(password);
  if (pwError) return { error: pwError };
  if (password !== confirm) return { error: "As senhas nao conferem." };

  const tokenHash = hashToken(token);
  const [pr] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        isNull(passwordResets.usedAt),
      ),
    )
    .limit(1);

  if (!pr || pr.expiresAt.getTime() < Date.now()) {
    return { error: "Link invalido ou expirado. Solicite um novo." };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(users.id, pr.userId));

  // Invalida este e quaisquer outros tokens pendentes do usuario.
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(
      and(eq(passwordResets.userId, pr.userId), isNull(passwordResets.usedAt)),
    );

  redirect("/login?reset=1");
}
