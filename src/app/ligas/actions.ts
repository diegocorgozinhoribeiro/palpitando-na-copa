"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { leagues, leagueMembers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateLeagueCode } from "@/lib/utils";
import { MAX_LEAGUES_PER_USER } from "@/lib/constants";

// Conta em quantas ligas o usuario participa (membro inclui as que criou,
// pois o criador entra como membro automaticamente).
async function countUserLeagues(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(leagueMembers)
    .where(eq(leagueMembers.userId, userId));
  return row?.n ?? 0;
}

export async function createLeagueAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const nome = String(formData.get("nome") || "").trim();
  if (nome.length < 3) return { error: "Nome da liga muito curto." };

  if ((await countUserLeagues(user.id)) >= MAX_LEAGUES_PER_USER) {
    return {
      error: `Voce ja atingiu o limite de ${MAX_LEAGUES_PER_USER} ligas.`,
    };
  }

  // Gera um codigo unico.
  let codigo = generateLeagueCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.codigo, codigo))
      .limit(1);
    if (exists.length === 0) break;
    codigo = generateLeagueCode();
  }

  const [created] = await db
    .insert(leagues)
    .values({ nome, codigo, ownerId: user.id })
    .returning({ id: leagues.id });

  await db
    .insert(leagueMembers)
    .values({ leagueId: created.id, userId: user.id });
  revalidatePath("/ligas");
  return { ok: true, codigo };
}

export async function joinLeagueAction(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const codigo = String(formData.get("codigo") || "")
    .trim()
    .toUpperCase();
  if (!codigo) return { error: "Informe o codigo da liga." };

  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.codigo, codigo))
    .limit(1);
  if (!league) return { error: "Liga nao encontrada." };

  const [already] = await db
    .select({ id: leagueMembers.id })
    .from(leagueMembers)
    .where(
      and(
        eq(leagueMembers.leagueId, league.id),
        eq(leagueMembers.userId, user.id),
      ),
    )
    .limit(1);
  if (already) return { error: "Voce ja participa dessa liga." };

  if ((await countUserLeagues(user.id)) >= MAX_LEAGUES_PER_USER) {
    return {
      error: `Voce ja atingiu o limite de ${MAX_LEAGUES_PER_USER} ligas. Saia de uma para entrar em outra.`,
    };
  }

  await db
    .insert(leagueMembers)
    .values({ leagueId: league.id, userId: user.id });
  revalidatePath("/ligas");
  return { ok: true, codigo };
}

export async function leaveLeagueAction(formData: FormData) {
  const user = await requireUser();
  const leagueId = String(formData.get("leagueId") || "");
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);
  if (!league) return;

  if (league.ownerId === user.id) {
    // Dono saindo: remove a liga inteira (e membros via cascade).
    await db.delete(leagues).where(eq(leagues.id, leagueId));
  } else {
    await db
      .delete(leagueMembers)
      .where(
        and(
          eq(leagueMembers.leagueId, leagueId),
          eq(leagueMembers.userId, user.id),
        ),
      );
  }
  revalidatePath("/ligas");
}

void or; // reservado para filtros futuros
